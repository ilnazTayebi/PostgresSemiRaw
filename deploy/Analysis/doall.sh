#!/bin/bash

# folders path and files name
analysis_file=analysis.py
analysis_query_plan_file=analysis-query-plan.py
result_folder=/result
result_exec_time_file=queryExecTime.csv
result_query_plan=queryPlan.csv
report_exp_time_folder=/report/charts-eval-exp-time
report_query_plan_folder=/report/charts-eval-plan
report_folder=/report

# *****************************************************************************************************************************************
# execute the analysis to generate the latex files of the plots and query plan
# *****************************************************************************************************************************************
python3 ${analysis_file} --method query_time_eval  --file ${result_folder}/${result_exec_time_file} --output ${report_exp_time_folder}
python3 ${analysis_query_plan_file} --method query_plan  --file ${result_folder}/${result_query_plan} --output ${report_query_plan_folder}

# *****************************************************************************************************************************************
# build the report
# *****************************************************************************************************************************************
make -C ${report_folder}