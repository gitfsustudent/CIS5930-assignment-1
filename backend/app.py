from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

EDGES_CSV_PATH = "paper_citation_links_within_fsu.csv"
WORKS_CSV_PATH = "fsu_works_2021_2026.csv"


def load_network():
    edges_df = pd.read_csv(EDGES_CSV_PATH, dtype=str)

    # Aggregate duplicate edges
    agg = (
        edges_df.groupby(["paper_id_1", "paper_id_2"])
        .size()
        .reset_index(name="value")
    )

    links = [
        {
            "source": str(row["paper_id_1"]),
            "target": str(row["paper_id_2"]),
            "value": int(row["value"]),
        }
        for _, row in agg.iterrows()
    ]

    # Unique node ids across both columns
    all_ids = pd.unique(edges_df[["paper_id_1", "paper_id_2"]].values.ravel())

    # Load the flattened works table for metadata, indexed by openalex_id for fast lookup
    works_df = pd.read_csv(WORKS_CSV_PATH, dtype=str)
    works_df = works_df.set_index("openalex_id")

    nodes = []
    for pid in all_ids:
        pid = str(pid)
        if pid in works_df.index:
            row = works_df.loc[pid]
            nodes.append({
                "id": pid,
                "group": 1,
                "title": row.get("title") if pd.notna(row.get("title")) else "Unknown title",
                "publication_year": row.get("publication_year") if pd.notna(row.get("publication_year")) else "Unknown",
                "venue": row.get("venue") if pd.notna(row.get("venue")) else "Unknown venue",
                "authors": row.get("authors") if pd.notna(row.get("authors")) else "Unknown authors",
            })
        else:
            # Node exists in the citation graph but isn't one of our own 26,599 works
            # (e.g. a cited paper outside the sample or outside FSU's own output)
            nodes.append({
                "id": pid,
                "group": 1,
                "title": "Unknown title",
                "publication_year": "Unknown",
                "venue": "Unknown venue",
                "authors": "Unknown authors",
            })

    return {"nodes": nodes, "links": links}


@app.route("/api/network")
def get_network():
    return jsonify(load_network())


if __name__ == "__main__":
    app.run(debug=True, port=5000)