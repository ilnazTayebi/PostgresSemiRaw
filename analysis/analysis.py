import argparse
import os

import matplotlib.pyplot as plt
import pandas as pd
import requests
from matplotlib.colors import TABLEAU_COLORS


def plot_execution_time_over_time(data):
    """
    Function to plot execution time over time for each query.
    """

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

    plt.title("Execution Time Over Time for Each Query")
    plt.xlabel("Local Time")
    plt.ylabel("Execution Time (s)")
    plt.legend(title="Queries", loc="upper center",
               bbox_to_anchor=(0.5, -0.2), ncol=1)
    plt.grid(True)
    plt.tight_layout()

    plt.savefig("exetime_Line.png", dpi=300, bbox_inches="tight")


def rename_queries(data):
    """
    Function to rename queries to Q1, Q2, etc.
    """
    unique_queries = data['Query'].unique()
    query_mapping = {query: f"Q{i + 1}" for i,
    query in enumerate(unique_queries)}
    data['Query_name'] = data['Query'].map(query_mapping)
    return data, query_mapping


def plot_execution_time_queries(data):
    """
    Function to plot execution time changes for each query.
    """

    # Plot Execution Time for each Query
    plt.figure(figsize=(10, 8))

    queries = data['Query_name'].unique()

    for query in queries:
        query_data = data[data['Query_name'] == query]
        plt.plot(query_data['Execution_Time'],
                 query_data['Query_name'], label=query)

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
    Function to plot execution time for each query with DB_Type as line style and different colors for queries.
    """

    if not {'Query', 'DB_Type', 'Execution_Time'}.issubset(data.columns):
        raise ValueError(
            "The data must contain 'Query', 'DB_Type', and 'Execution_Time' columns.")

    data = data.sort_values(by='Query_name')

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
        plt.plot(
            db_data['Query_name'],
            db_data['Execution_Time'],
            label=f"DB Type: {db_type}",
            linestyle=line_style_map[db_type]
        )

    # Add plot details
    plt.title("Query Execution Time by DB Type", fontsize=16)
    plt.xlabel("Query", fontsize=14)
    plt.ylabel("Execution Time (s)", fontsize=14)
    plt.xticks(rotation=45)
    plt.legend(title="DB Types", fontsize=12, title_fontsize=14)
    plt.grid(True)

    # Show the plot
    plt.tight_layout()
    plt.savefig("query_execution_time_by_db_type.png",
                dpi=300, bbox_inches="tight")


def plot_execution_time_over_query(data, is_stat, output_folder):
    """
    Function to plot execution time over the repeats for each query, grouped by DB_Type.
    Each DB_Type is represented by a unique color, with markers shown only at the beginning and end of each line.
    Alongside each plot, generate a LaTeX file that includes the plot.
    """

    charts_latex_path = "charts-eval-exp-time-stat" if is_stat else "charts-eval-exp-time"

    os.makedirs(output_folder, exist_ok=True)

    queries = data['Query_name'].unique()

    colors = list(TABLEAU_COLORS.values())
    num_colors = len(colors)

    db_types = data['DB_Type'].unique()
    color_map = {db_type: colors[i % num_colors]
                 for i, db_type in enumerate(db_types)}

    image_paths = []
    for query in queries:
        query_data = data[data['Query_name'] == query]
        if query_data['Execution_Time'].dropna().empty:
            print(f"Skipping plot for {query} as Execution_Time is empty.")
            continue

        plt.figure(figsize=(5, 5))

        actual_query = data[data['Query_name'] == query]['Query'].iloc[0]

        for db_type in data['DB_Type'].unique():
            query_data = data[(data['Query_name'] == query)
                              & (data['DB_Type'] == db_type)]

            if not query_data.empty:
                color = color_map[db_type]

                plt.plot(
                    query_data['Repeat_Count'],
                    query_data['Execution_Time'],
                    label=f"{db_type}",
                    color=color,
                    alpha=0.8,
                    linestyle='-'
                )

                # Add markers only at the beginning and end
                plt.scatter(
                    [query_data['Repeat_Count'].iloc[0],
                     query_data['Repeat_Count'].iloc[-1]],
                    [query_data['Execution_Time'].iloc[0],
                     query_data['Execution_Time'].iloc[-1]],
                    color=color,
                    marker='o',
                    s=40,  # Marker size
                    zorder=5  # Place markers on top
                )

        plt.xlabel("Number of query execution", fontsize=12)
        plt.ylabel("Execution Time (s)", fontsize=12)
        plt.legend(title="Database", fontsize=12,
                   title_fontsize=12,
                   loc="lower right",
                   bbox_to_anchor=(1, 0.13))
        plt.grid(True)

        # Save the plot
        plot_filename = f"execution_time_db_type_{query}.pdf"
        full_plot_path = os.path.join(output_folder, plot_filename)
        plt.tight_layout()

        plt.savefig(full_plot_path,
                    dpi=300, bbox_inches="tight")
        plt.clf()
        image_paths.append((plot_filename, query))
        ###########################################################################################
        # Generate LaTeX file for the plot
        ###########################################################################################
        caption_latex = actual_query.replace("_", r"\_")

        full_caption_latex = f"The execution times for query {query} over {data['Repeat_Count'].max()} iterations using various types of PostgresSemiRaw and PostgresRaw. These databases include TPC-H data with the \\acrshort{{sf}} 0.1 alongside different levels of metadata."

        latex_content = (
            f"\\begin{{figure}}[hbt!]\n"
            f"\\centering\n"
            f"\\includegraphics[width=1.0\\linewidth]{{{charts_latex_path}/{plot_filename}}}\n"
            f"\\caption[{query}:result]{{{full_caption_latex}}}\n"
            f"\\label{{fig:{plot_filename.replace('.pdf', '')}}}\n"
            f"\\end{{figure}}\n"
        )
        tex_filename = os.path.join(
            output_folder, f"execution_time_db_type_{query}.tex")
        with open(tex_filename, "w") as f:
            f.write(latex_content)

        ###########################################################################################
        # Generate LaTeX files in groups of 4
        ###########################################################################################
        # image_paths.append((filename, query))

        for i in range(0, len(image_paths), 4):
            # Get the current group of up to 4 images
            group = image_paths[i:i + 4]
            group_number = (i // 4) + 1
            group_tex_filename = os.path.join(output_folder, f"execution_time_group_{group_number}.tex")

            # Create main caption with query names
            if len(group) > 1:
                group_queries = ", ".join(
                    query for _, query in group[:-1]) + f", and {group[-1][1]}"
            else:
                group_queries = group[0][1]

            main_caption = (
                f"The execution times for queries {group_queries} over {data['Repeat_Count'].max()} "
                f"iterations using various types of PostgresSemiRaw and PostgresRaw. These databases include TPC-H data with the \\acrshort{{sf}} 0.1 alongside different levels of metadata."
            )

            with open(group_tex_filename, "w") as f:
                f.write("\\begin{figure}[hbt!]\n")
                f.write("\\centering\n")

                for j, (img_path, caption_query) in enumerate(group):
                    if j % 2 == 0 and j != 0:
                        # Add vertical spacing between rows
                        f.write("\\vspace{0.5cm}\n")

                    f.write("\\begin{minipage}[b]{0.45\\linewidth}\n")
                    f.write(f"    \\centering\n")
                    f.write(
                        f"    \\includegraphics[width=1.0\\linewidth]{{{charts_latex_path}/{img_path}}}\n")
                    f.write(f"    \\caption*{{{caption_query}}}\n")
                    f.write("\\end{minipage}\n")

                    if j % 2 == 0:  # Add spacing between columns
                        f.write("\\hfill\n")

                f.write(f"\\caption{{{main_caption}}}\n")
                f.write("\\label{fig:execution_time_group}\n")
                f.write(f"\\label{{fig:execution_time_group_{group_number}}}\n")
                f.write("\\end{figure}\n")
            print(f"Generated LaTeX file: {group_tex_filename}")


def main(args):
    """
    Main function to run the analysis and generate the latex file.
    """
    try:

        # Load data
        data = pd.read_csv(args.file, quotechar="'", skipinitialspace=True)

        # Clean data
        data = data.apply(lambda x: x.str.strip() if x.dtype == "object" else x)
        data['DB_Type'] = data['DB_Type'].str.split(' ').str[0]

        data.columns = data.columns.str.strip()

        # Give a name to the queries(Qn)
        data, query_mapping = rename_queries(data)
        print(data['Query_name'].unique())

        data['Repeat_Count'] = data.groupby(['Query', 'DB_Type']).cumcount() + 1

        if args.method == "over_time":
            plot_execution_time_over_time(data)
        elif args.method == "query_eval":
            plot_execution_time_queries(data)
        elif args.method == "db_eval":
            plot_query_execution_time_by_db_type(data)
        elif args.method == "query_time_eval":
            plot_execution_time_over_query(data, False, args.output)
        elif args.method == "query_time_eval_stat":
            plot_execution_time_over_query(data, True, args.output)

    except requests.exceptions.ConnectionError as co:
        print("Connection failed:", co)
    except Exception as ex:
        print("Error occurred:", ex)


def setup():
    """
    Function to evaluate flags from the commandline arguments.
    """
    parser = argparse.ArgumentParser(description="Choose a plotting method.")
    parser.add_argument(
        '-m', '--method',
        choices=["over_time", "query_eval", "db_eval",
                 "query_time_eval", "query_time_eval_stat"],
        required=True,
        help="Choose 'over_time' to plot execution time over time\n 'query_eval' to plot execution time changes for each query\n Choose 'db_eval' to plot execution time for each query based on different db type "
             + "\n Choose 'query_time_eval' to plot execution time for each each query based on running query n time.",
    )
    parser.add_argument(
        '-f', '--file', default='../result/queryExecTime.csv', type=str,
        required=True, help="Path to the CSV file containing the data.",
    )
    # output_folder = "../report/charts-eval-exp-time-stat" if is_stat else "../report/charts-eval-exp-time"
    parser.add_argument(
        '-o', '--output', default='../report/charts-eval-exp-time', type=str,
        required=True, help="Path to the output files directory.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    main(setup())
