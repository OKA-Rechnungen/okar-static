#!/usr/bin/env python
import glob
import os
import re

from typesense.api_call import ObjectNotFound
from acdh_cfts_pyutils import TYPESENSE_CLIENT as client
from acdh_tei_pyutils.tei import TeiReader
from tqdm import tqdm


YEAR_CANDIDATE_ATTRS = (
    "//tei:origin/tei:origDate/@when",
    "//tei:origin/tei:origDate/@notBefore",
    "//tei:origin/tei:origDate/@from",
    "//tei:origin/tei:origDate/@notAfter",
    "//tei:sourceDesc//tei:date/@when",
    "//tei:sourceDesc//tei:date/@from",
    "//tei:sourceDesc//tei:date/@notBefore",
)

YEAR_CANDIDATE_TEXTS = (
    "//tei:origin/tei:origDate/text()",
    "//tei:sourceDesc//tei:date/text()",
)


def extract_year_from_string(value):
    if not value:
        return None
    match = re.search(r"-?(\d{4})", value)
    if not match:
        return None
    try:
        return int(match.group(1))
    except ValueError:
        return None


def resolve_year(doc):
    for path in YEAR_CANDIDATE_ATTRS:
        for candidate in doc.any_xpath(path):
            year = extract_year_from_string(candidate)
            if year:
                return year
    for path in YEAR_CANDIDATE_TEXTS:
        for candidate in doc.any_xpath(path):
            year = extract_year_from_string(candidate)
            if year:
                return year
    return None


files = glob.glob("./data/editions/**/*.xml", recursive=True)


try:
    client.collections["OKAR"].delete()
except ObjectNotFound:
    pass

current_schema = {
    "name": "OKAR",
    "fields": [
        {"name": "id", "type": "string"},
        {"name": "rec_id", "type": "string"},
        {"name": "title", "type": "string"},
        {"name": "full_text", "type": "string"},
        {
            "name": "year",
            "type": "int32",
            "optional": True,
            "facet": True,
        },
        {"name": "signature", "type": "string", "facet": True, "optional": True},
        {"name": "kaemmerer", "type": "string[]", "facet": True, "optional": True},
        {"name": "beilage_present", "type": "bool", "facet": True, "optional": True},
        {"name": "beilage_text", "type": "string", "optional": True},
    ],
}

client.collections.create(current_schema)


records = []
nsmap = {"tei": "http://www.tei-c.org/ns/1.0"}


for x in tqdm(files, total=len(files)):
    doc = TeiReader(xml=x)
    record_year = resolve_year(doc)
    shelfmarks = doc.any_xpath("//tei:msIdentifier/tei:idno[@type='shelfmark']/text()")
    signature = " ".join(" ".join(shelfmarks).split())

    kaemmerer_nodes = doc.any_xpath(
        "//tei:standOff/tei:listPerson/tei:person[contains(translate(@role, 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜẞ', 'abcdefghijklmnopqrstuvwxyzäöüß'), 'kämmerer')]"
    )
    kaemmerer = []
    for person in kaemmerer_nodes:
        preferred = " ".join(
            " ".join(person.xpath("tei:persName[@type='norm'][1]//text()", namespaces=nsmap)).split()
        )
        fallback = " ".join(
            " ".join(person.xpath("tei:persName[1]//text()", namespaces=nsmap)).split()
        )
        label = preferred or fallback
        if label:
            kaemmerer.append(label)
    kaemmerer = sorted(set(kaemmerer))

    beilage_text_nodes = doc.any_xpath("//tei:accMat//text()")
    beilage_text = " ".join(" ".join(beilage_text_nodes).split())
    beilage_present = bool(beilage_text)
    facs = doc.any_xpath(".//tei:body/tei:div/tei:pb/@facs")
    pages = 0
    for v in facs:
        p_group = (
            ".//tei:body/tei:div/tei:p[preceding-sibling::tei:pb[1]/@facs='{f}']|"
            ".//tei:body/tei:div/tei:lg[preceding-sibling::tei:pb[1]/@facs='{f}']|"
            ".//tei:body/tei:div/tei:ab[preceding-sibling::tei:pb[1]/@facs='{f}']"
        ).format(f=v)
        body = doc.any_xpath(p_group)
        pages += 1
        record = {}
        record["id"] = os.path.split(x)[-1].replace(".xml", f".html?p={str(pages)}")
        record["rec_id"] = os.path.split(x)[-1]
        r_title = " ".join(
            " ".join(
                doc.any_xpath('.//tei:titleStmt/tei:title[@level="a"]/text()')
            ).split()
        )
        if not r_title:
            r_title = " ".join(
                " ".join(
                    doc.any_xpath('.//tei:titleStmt/tei:title[@type="desc"]/text()')
                ).split()
            )
        if not r_title:
            r_title = record["rec_id"].replace(".xml", "")
        record["title"] = f"{r_title} · Seite {str(pages)}"
        if record_year is not None:
            record["year"] = record_year

        if len(body) > 0:
            record["full_text"] = "\n".join(
                " ".join("".join(p.itertext()).split()) for p in body
            )
            if signature:
                record["signature"] = signature
            if kaemmerer:
                record["kaemmerer"] = kaemmerer
            record["beilage_present"] = beilage_present
            if beilage_text:
                trimmed_beilage = (
                    beilage_text if len(beilage_text) <= 200 else f"{beilage_text[:197]}..."
                )
                record["beilage_text"] = trimmed_beilage
            if len(record["full_text"]) > 0:
                records.append(record)

print(f"prepared {len(records)} records for import")

make_index = client.collections[
    "OKAR"
].documents.import_(
    records,
    {
        "action": "upsert",
    },
)

failed = [row for row in make_index if '"success":false' in row]
if failed:
    print(f"{len(failed)} records failed to import")
    print(failed[:5])
else:
    print(f"imported {len(records)} records")
print("done with indexing OKAR")
