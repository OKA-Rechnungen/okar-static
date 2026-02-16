#!/usr/bin/env python
import argparse
import glob
import os
import re
from urllib.parse import quote, urlparse
from typesense.api_call import ObjectNotFound
from typing import Any
from acdh_cfts_pyutils import TYPESENSE_CLIENT
from acdh_tei_pyutils.tei import TeiReader
from tqdm import tqdm

client: Any = TYPESENSE_CLIENT

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


def extract_graphic_filename(value):
    if not value:
        return ""
    parsed = urlparse(value)
    target_path = parsed.path or value
    return os.path.basename(target_path)


def normalize_image_filename(record_id, value, default_extension=".tif"):
    value = (value or "").strip()
    if not value:
        return ""

    base_name = extract_graphic_filename(value)
    name_part, _ext = os.path.splitext(base_name)
    extension = default_extension or _ext or ".tif"
    match = re.search(r"(\d+)$", name_part)
    if match:
        digits = match.group(1)
        padded = f"{int(digits):05d}"
        name_part = f"{name_part[:-len(digits)]}{padded}"

    return f"{name_part}{extension}"


def main():
    parser = argparse.ArgumentParser(
        description="Build / update the Typesense OKAR index from TEI editions"
    )
    parser.add_argument(
        "--recreate",
        action="store_true",
        help="Delete and recreate the OKAR collection before importing (destructive).",
    )
    parser.add_argument(
        "--collection",
        default="OKAR",
        help="Typesense collection name (default: OKAR)",
    )
    parser.add_argument(
        "--source-glob",
        default="./data/editions/**/*.xml",
        help="Glob for TEI sources (default: ./data/editions/**/*.xml)",
    )
    args = parser.parse_args()

    files = glob.glob(args.source_glob, recursive=True)

    collection_name = args.collection

    if args.recreate:
        try:
            client.collections[collection_name].delete()
        except ObjectNotFound:
            pass

    current_schema = {
        "name": collection_name,
        "fields": [
            {"name": "id", "type": "string", "sort": True},
            {"name": "rec_id", "type": "string", "facet": True, "sort": True},
            {"name": "page", "type": "int32", "sort": True},
            {"name": "title", "type": "string", "sort": True},
            {"name": "full_text", "type": "string"},
            {
                "name": "year",
                "type": "int32",
                "optional": True,
                "facet": True,
                "sort": True,
            },
            {"name": "signature", "type": "string", "facet": True, "optional": True},
            {"name": "kaemmerer", "type": "string[]", "facet": True, "optional": True},
            {"name": "beilage_present", "type": "bool", "facet": True, "optional": True},
            {"name": "beilage_text", "type": "string", "optional": True},
            {"name": "image_source", "type": "string", "optional": True},
            {"name": "thumbnail", "type": "string", "optional": True},
        ],
    }

    # Create collection if it doesn't exist (or if --recreate deleted it).
    try:
        client.collections[collection_name].retrieve()
    except ObjectNotFound:
        client.collections.create(current_schema)

    def iter_import_rows(rows):
        if rows is None:
            return
        # The Typesense Python client may return either a list of JSON strings
        # or a single newline-delimited string.
        if isinstance(rows, (bytes, bytearray)):
            rows = rows.decode("utf-8", errors="replace")
        if isinstance(rows, str):
            rows = rows.splitlines()

        for row in rows:
            if isinstance(row, dict):
                yield row
                continue
            if isinstance(row, (bytes, bytearray)):
                row = row.decode("utf-8", errors="replace")
            if isinstance(row, str):
                row = row.strip()
                if not row:
                    continue
                try:
                    import json

                    parsed = json.loads(row)
                    if isinstance(parsed, str):
                        # Some client versions return a JSON-encoded string that
                        # itself contains the JSON object, e.g. "{\"success\":true}".
                        parsed = json.loads(parsed)
                    if isinstance(parsed, dict):
                        yield parsed
                    else:
                        yield {
                            "success": False,
                            "error": "Unexpected import response payload",
                            "raw": row,
                            "parsed": parsed,
                        }
                except Exception:
                    # Fallback: if we can't parse a row, treat it as a failure container.
                    yield {"success": False, "error": "Could not parse import response row", "raw": row}
                continue
            yield {"success": False, "error": f"Unexpected import response type: {type(row).__name__}", "raw": str(row)}

    def import_in_batches(all_records, batch_size=1000):
        total = len(all_records)
        failures = []
        imported = 0
        for start in range(0, total, batch_size):
            batch = all_records[start : start + batch_size]
            result_rows = client.collections[collection_name].documents.import_(
                batch,
                {
                    "action": "upsert",
                },
            )
            for row in iter_import_rows(result_rows):
                if not row.get("success"):
                    failures.append(row)
            imported += len(batch)
            print(f"imported batch {imported}/{total}")
        return failures

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

        # UI label is "Inhalt" (scope/overview). Prefer msContents text.
        # TEI structure varies across volumes (e.g. text may live under msItem/p,
        # or other nested elements). Keep this intentionally broad so TOC is stable.
        # Exclude origDate fragments which are sometimes mixed into the same area.
        inhalt_nodes = doc.any_xpath(
            "//tei:msDesc/tei:msContents//tei:summary//text() | "
            "//tei:msDesc/tei:msContents//tei:p//text()[not(ancestor::tei:origDate)] | "
            "//tei:msDesc/tei:msContents//text()[not(ancestor::tei:origDate)]"
        )
        beilage_text = " ".join(" ".join(inhalt_nodes).split())
        if not beilage_text:
            # Backwards-compatible fallback (some sources stored this text in accMat).
            beilage_text_nodes = doc.any_xpath("//tei:accMat//text()")
            beilage_text = " ".join(" ".join(beilage_text_nodes).split())
        beilage_present = bool(beilage_text)
        facs = doc.any_xpath(".//tei:body/tei:div/tei:pb/@facs")

        doc_has_page_records = False
        # Use the same page numbering as the edition viewer (counts every pb),
        # even if a page has no extracted body text.
        page_number = 0
        for v in facs:
            page_number += 1
            p_group = (
                ".//tei:body/tei:div/tei:p[preceding-sibling::tei:pb[1]/@facs='{f}']|"
                ".//tei:body/tei:div/tei:lg[preceding-sibling::tei:pb[1]/@facs='{f}']|"
                ".//tei:body/tei:div/tei:ab[preceding-sibling::tei:pb[1]/@facs='{f}']"
            ).format(f=v)
            body = doc.any_xpath(p_group)

            if len(body) == 0:
                continue

            record = {}
            record["id"] = os.path.split(x)[-1].replace(
                ".xml", f".html?p={str(page_number)}"
            )
            record["rec_id"] = os.path.split(x)[-1]
            record["page"] = page_number
            r_title = " ".join(
                " ".join(
                    doc.any_xpath(
                        './/tei:titleStmt/tei:title[@level="a" and @type="desc"]/text()'
                    )
                ).split()
            )
            if not r_title:
                r_title = " ".join(
                    " ".join(
                        doc.any_xpath(
                            './/tei:titleStmt/tei:title[@level="a" and (@type="main" or not(@type))]/text()'
                        )
                    ).split()
                )
            if not r_title:
                r_title = record["rec_id"].replace(".xml", "")
            record["title"] = f"{r_title} · Seite {str(page_number)}"
            if record_year is not None:
                record["year"] = record_year

            record["full_text"] = "\n".join(
                " ".join("".join(p.itertext()).split()) for p in body
            )

            surface_id = v.lstrip("#")
            graphic_candidates = doc.any_xpath(
                f"//tei:facsimile/tei:surface[@xml:id='{surface_id}']//tei:graphic/@url"
            )
            image_filename = ""
            fallback_candidate = ""
            for candidate in graphic_candidates:
                candidate = candidate.strip()
                if not candidate:
                    continue

                normalized = normalize_image_filename(record_id, candidate)
                if normalized:
                    image_filename = normalized
                    break

                if not fallback_candidate and not candidate.lower().startswith("http"):
                    fallback_candidate = candidate

            if not image_filename and fallback_candidate:
                image_filename = normalize_image_filename(record_id, fallback_candidate)

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
                doc_has_page_records = True

        # Some TEIs only contain <pb/> markers without any interleaved <p>/<ab>/<lg>
        # transcription content. In that case, ensure the record still appears in
        # the TOC by upserting a single fallback page document (prefer p=2).
        if not doc_has_page_records and facs:
            fallback_page = 2 if len(facs) >= 2 else 1
            fallback_facs = facs[fallback_page - 1]
            record = {}
            record["id"] = os.path.split(x)[-1].replace(
                ".xml", f".html?p={str(fallback_page)}"
            )
            record["rec_id"] = os.path.split(x)[-1]
            record["page"] = fallback_page
            r_title = " ".join(
                " ".join(
                    doc.any_xpath(
                        './/tei:titleStmt/tei:title[@level="a" and @type="desc"]/text()'
                    )
                ).split()
            )
            if not r_title:
                r_title = " ".join(
                    " ".join(
                        doc.any_xpath(
                            './/tei:titleStmt/tei:title[@level="a" and (@type="main" or not(@type))]/text()'
                        )
                    ).split()
                )
            if not r_title:
                r_title = record["rec_id"].replace(".xml", "")
            record["title"] = f"{r_title} · Seite {str(fallback_page)}"
            if record_year is not None:
                record["year"] = record_year

            # Use the msContents-derived scope as searchable text when there is
            # no page transcription.
            record["full_text"] = beilage_text or r_title or record_id

            surface_id = str(fallback_facs).lstrip("#")
            graphic_candidates = doc.any_xpath(
                f"//tei:facsimile/tei:surface[@xml:id='{surface_id}']//tei:graphic/@url"
            )
            image_filename = ""
            fallback_candidate = ""
            for candidate in graphic_candidates:
                candidate = candidate.strip()
                if not candidate:
                    continue

                normalized = normalize_image_filename(record_id, candidate)
                if normalized:
                    image_filename = normalized
                    break

                if not fallback_candidate and not candidate.lower().startswith("http"):
                    fallback_candidate = candidate

            if not image_filename and fallback_candidate:
                image_filename = normalize_image_filename(record_id, fallback_candidate)

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
            records.append(record)

    print(f"prepared {len(records)} records for import")

    failed = import_in_batches(records, batch_size=1000)
    if failed:
        print(f"{len(failed)} records failed to import")
        print(failed[:5])
    else:
        print(f"imported {len(records)} records")
    print("done with indexing OKAR")


if __name__ == "__main__":
    main()
