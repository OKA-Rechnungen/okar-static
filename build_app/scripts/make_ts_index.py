#!/usr/bin/env python
import glob
import os
import re
from urllib.parse import quote, urlparse

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


def derive_image_source(record_id, page_number, fallback_source):
    record_id = (record_id or "").strip()
    fallback_source = (fallback_source or "").strip()
    extension = ".tif"

    if record_id and fallback_source:
        candidate = os.path.basename(fallback_source)
        name_part, _ = os.path.splitext(candidate)
        record_pos = name_part.find(record_id)
        if record_pos != -1:
            normalized = name_part[record_pos:]
            if normalized:
                return f"{normalized}{extension}"

    if record_id and page_number is not None:
        page_digits = str(page_number).zfill(5)
        return f"{record_id}_{page_digits}{extension}"

    return fallback_source


def extract_graphic_filename(value):
    if not value:
        return ""
    parsed = urlparse(value)
    target_path = parsed.path or value
    return os.path.basename(target_path)


files = glob.glob("./data/editions/**/*.xml", recursive=True)


try:
    client.collections["OKAR"].delete()
except ObjectNotFound:
    pass

current_schema = {
    "name": "OKAR",
    "fields": [
        {"name": "id", "type": "string"},
    {"name": "rec_id", "type": "string", "facet": True},
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
        {"name": "image_source", "type": "string", "optional": True},
        {"name": "thumbnail", "type": "string", "optional": True},
    ],
}

client.collections.create(current_schema)


records = []
nsmap = {"tei": "http://www.tei-c.org/ns/1.0"}


for x in tqdm(files, total=len(files)):
    doc = TeiReader(xml=x)
    record_id = os.path.splitext(os.path.split(x)[-1])[0]
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

        if len(body) == 0:
            continue

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

        record["full_text"] = "\n".join(
            " ".join("".join(p.itertext()).split()) for p in body
        )

        surface_id = v.lstrip("#")
        graphic_candidates = doc.any_xpath(
            f"//tei:facsimile/tei:surface[@xml:id='{surface_id}']//tei:graphic/@url"
        )
        thumbnail_source = ""
        for candidate in graphic_candidates:
            candidate = candidate.strip()
            if not candidate:
                continue
            if not candidate.lower().startswith("http"):
                thumbnail_source = candidate
                break
        if not thumbnail_source and graphic_candidates:
            thumbnail_source = graphic_candidates[0].strip()

        image_filename = ""
        if graphic_candidates:
            for candidate in graphic_candidates:
                candidate = candidate.strip()
                if not candidate:
                    continue
                image_filename = extract_graphic_filename(candidate)
                if image_filename:
                    break

        if not image_filename and record_id and pages:
            image_filename = derive_image_source(record_id, pages, thumbnail_source)

        if image_filename:
            record["image_source"] = image_filename
            encoded_record = quote(record_id, safe="")
            encoded_source = quote(image_filename, safe="")
            record["thumbnail"] = (
                "https://viewer.acdh.oeaw.ac.at/viewer/api/v1/records/"
                f"{encoded_record}/files/images/{encoded_source}/full/!400,400/0/default.jpg"
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
