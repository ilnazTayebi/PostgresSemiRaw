import pandas as pd
import matplotlib.pyplot as plt
import argparse
import seaborn as sns


def plot_execution_time_over_time(data):
    """Plot execution time over time for each query."""

    data['Local_Time'] = pd.to_datetime(data['Local_Time'], errors='coerce')
    # Drop rows with invalid Execution_Time or Local_Time
    data = data.dropna(subset=['Local_Time'])

    # Sort data by Local_Time for proper plotting
    data = data.sort_values(by='Local_Time')

    # Plot Execution Time over Time for each Query
    plt.figure(figsize=(12, 8))
    queries = data['Query'].unique()

    for query in queries:
        query_data = data[data['Query'] == query]
        plt.plot(query_data['Local_Time'],
                 query_data['Execution_Time'], label=query, marker='o')

    # Add labels, title, and legend
    plt.title("Execution Time Over Time for Each Query")
    plt.xlabel("Local Time")
    plt.ylabel("Execution Time (s)")
    plt.legend(title="Queries", loc="upper center",
               bbox_to_anchor=(0.5, -0.2), ncol=1)
    plt.grid(True)
    plt.tight_layout()

    plt.savefig("exetime_Line.png", dpi=300, bbox_inches="tight")


def rename_queries(data):
    """Rename queries to Q1, Q2, etc."""
    unique_queries = data['Query'].unique()
    query_mapping = {query: f"Q{i + 1}" for i,
                     query in enumerate(unique_queries)}
    data['Query_name'] = data['Query'].map(query_mapping)
    return data, query_mapping


def plot_execution_time_queries(data):
    """Plot execution time changes for each query."""

    # data = data.sort_values(by='Execution_Time')

    # Plot Execution Time for each Query
    plt.figure(figsize=(10, 8))

    queries = data['Query_name'].unique()

    for query in queries:
        query_data = data[data['Query_name'] == query]
        plt.plot(query_data['Execution_Time'],
                 query_data['Query_name'], label=query, marker='o')

    # Add labels, title, and legend
    plt.title("Execution Time Changes for Each Query")
    plt.xlabel("Occurrence (Execution Order)")
    plt.ylabel("Execution Time (s)")
    plt.xticks(rotation=45)

    plt.legend(title="Queries", loc="upper right", bbox_to_anchor=(1.3, 1))
    plt.grid(True)
    plt.tight_layout()

    plt.savefig("execution_time_per_query.png",
                dpi=300, bbox_inches="tight")


def plot_query_execution_time_by_db_type(data):
    """
    Plot execution time for each query with DB_Type as line style and different colors for queries.
    """

    if not {'Query', 'DB_Type', 'Execution_Time'}.issubset(data.columns):
        raise ValueError(
            "The data must contain 'Query', 'DB_Type', and 'Execution_Time' columns.")

    queries = data['Query_name'].unique()
    data = data.sort_values(by='Query')

    # Set up the plot
    plt.figure(figsize=(12, 8))

    # Get unique DB types and assign line styles
    db_types = data['DB_Type'].unique()
    line_styles = ['-', '--', '-.', ':']
    line_style_map = {db_type: line_styles[i % len(
        line_styles)] for i, db_type in enumerate(db_types)}

    # Plot each DB_Type with a unique line style
    for db_type in db_types:
        db_data = data[data['DB_Type'] == db_type]
        sns.lineplot(
            x='Query',
            y='Execution_Time',
            data=db_data,
            label=f"DB Type: {db_type}",
            linestyle=line_style_map[db_type],
            marker='o'
        )

    # Add plot details
    plt.title("Query Execution Time by DB Type", fontsize=16)
    plt.xlabel("Query", fontsize=14)
    plt.ylabel("Execution Time (s)", fontsize=14)
    plt.xticks(rotation=45)
    plt.legend(title="Legend", fontsize=12, title_fontsize=14)
    plt.grid(True)

    # Show the plot
    plt.tight_layout()
    plt.savefig("query_execution_time_by_db_type.png",
                dpi=300, bbox_inches="tight")


def main():
    parser = argparse.ArgumentParser(description="Choose a plotting method.")
    parser.add_argument(
        "--method",
        choices=["over_time", "query_eval", "db_eval"],
        required=True,
        help="Choose 'over_time' to plot execution time over time\n 'query_eval' to plot execution time changes for each query\n Choose 'db_eval' to plot execution time for each query based on different db type ",
    )

    # file_path = "../result/queryExecTime.csv"
    parser.add_argument(
        "--file",
        required=True,
        help="Path to the CSV file containing the data.",
    )

    args = parser.parse_args()

    # Load data
    data = pd.read_csv(args.file, quotechar='"', skipinitialspace=True)
    # Clean column names
    data.columns = data.columns.str.strip()

    # Convert Execution_Time to numeric
    data['Execution_Time'] = pd.to_numeric(
        data['Execution_Time'], errors='coerce')
    # Drop invalid rows
    data = data.dropna(subset=['Execution_Time'])

    # Give a name to the queries(Qn)
    data, query_mapping = rename_queries(data)

    if args.method == "over_time":
        plot_execution_time_over_time(data)
    elif args.method == "query_eval":
        plot_execution_time_queries(data)
    elif args.method == "db_eval":
        plot_query_execution_time_by_db_type(data)


if __name__ == "__main__":
    main()
