#!/bin/bash

# Check if a folder was provided as an argument
if [ -z "$1" ]; then
    echo "Usage: $0 <folder_path>"
    exit 1
fi

# Get the folder path from the argument
folder_path=$(realpath "$1")
folder_name=$(basename "$folder_path")
parent_dir=$(dirname "$folder_path")
new_folder="${parent_dir}/sf${folder_name}"

mkdir -p "$new_folder"

# Process each .tbl file in the specified folder
for file in "$folder_path"/*.tbl; do
    # Skip if no .tbl files are found
    if [ ! -f "$file" ]; then
        echo "No .tbl files found in the folder: $folder_path"
        exit 1
    fi


    cleaned_file="$new_folder/$(basename "$file")"
    sed 's/|$//' "$file" > "$cleaned_file"
    echo "Processed: $file -> $cleaned_file"
done


