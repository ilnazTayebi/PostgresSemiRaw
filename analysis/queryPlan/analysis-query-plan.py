import pandas as pd
import argparse


def rename_queries(data):
    """Rename queries to Q1, Q2, etc."""
    unique_queries = data['Query'].unique()
    query_mapping = {query: f"Q{i + 1}" for i,
                     query in enumerate(unique_queries)}
    data['Query_name'] = data['Query'].map(query_mapping)
    return data, query_mapping


def generate_query_plan_latex_file(data):

    # Define unique line styles for DB_Type
    db_types = data['DB_Type'].unique()

    # Define colors for each query
    queries = data['Query_name'].unique()

    for query in queries:
        for db_type in db_types:
            query_data = data[(data['Query_name'] == query)
                              & (data['DB_Type'] == db_type)]
            if not query_data.empty:
                query_plan = query_data['Query_result'].iloc[0]
                explain_query = f"{query_data['Query'].iloc[0]}"

                # Create LaTeX content
                latex_content = (
                    f"\\begin{{figure}}[h]\n"
                    f"\\centering\n"
                    f"    \\begin{{minted}}\n"
                    f"    [\n"
                    f"    framesep=2mm,\n"
                    f"    baselinestretch=1.2,\n"
                    f"    bgcolor=LightGray,\n"
                    f"    fontsize=\\footnotesize\n"
                    f"    ]{{text}}\n"
                    f"    {explain_query};\n"
                    f"                                        QUERY PLAN\n"
                    f"    ----------------------------------------------------------------\n"
                    f"    {query_plan}\n"
                    f"    \\end{{minted}}\n"
                    f"\\caption{{Example of an EXPLAIN Query. Query over the TPCH dataset with the SF 0.1.}}\n"
                    f"\\label{{fig:explain-{query.replace(' ', '-').lower()}}}\n"
                    f"\\end{{figure}}"
                )

                filename = f"query_plan_{query.replace(' ', '_').replace('*', 'all')}.tex"
                filename = "".join(
                    c for c in filename if c.isalnum() or c in ['_', '.', '-'])

                with open(filename, "w") as f:
                    f.write(latex_content)

                print(f"Generated LaTeX file: {filename}")


def main():
    parser = argparse.ArgumentParser(description="Choose a plotting method.")
    parser.add_argument(
        "--method",
        choices=["query_plan"],
        required=True,
        help="Choose 'query_plan' to plot execution time over time.",
    )

    # file_path = "../../result/queryPlan.csv"
    parser.add_argument(
        "--file",
        required=True,
        help="Path to the CSV file containing the data.",
    )

    args = parser.parse_args()

    # Load data
    data = pd.read_csv(args.file, quotechar="'", skipinitialspace=True)

    # Clean data
    data = data.apply(lambda x: x.str.strip() if x.dtype == "object" else x)
    data['DB_Type'] = data['DB_Type'].str.split(' ').str[0]

    data.columns = data.columns.str.strip()

    # Give a name to the queries(Qn)
    data, query_mapping = rename_queries(data)

    data['Repeat_Count'] = data.groupby(['Query', 'DB_Type']).cumcount() + 1

    if args.method == "query_plan":
        generate_query_plan_latex_file(data)


if __name__ == "__main__":
    main()
