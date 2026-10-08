from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

CSV_PATH = "paper_citation_links_within_fsu.csv"


def load_network():
    edges_df = pd.read_csv(CSV_PATH, dtype=str)

    # Aggregate duplicate edges: count how many times each (source, target) pair repeats
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

    # Nodes are the unique ids across BOTH columns
    all_ids = pd.unique(edges_df[["paper_id_1", "paper_id_2"]].values.ravel())
    nodes = [{"id": str(pid), "group": 1} for pid in all_ids]

    return {"nodes": nodes, "links": links}


@app.route("/api/network")
def get_network():
    return jsonify(load_network())


if __name__ == "__main__":
    app.run(debug=True, port=5000)