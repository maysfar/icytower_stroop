# Python script to compute required variables for data analysis
# in icytower-stroop project

import pandas as pd
import csv
import numpy as np
import os
from pathlib import Path

file_pathway = "" #where to save results
drive_folder = "" #experiment results folder from drive
qualtrics_file = "" #questionnaire results from qualtrics


def create_subject_files_dict(drive_folder): #returns dictionary. keys are subject IDs and values are list of two files
    files = os.listdir(drive_folder)
    subject_files_dict = {}
    subjects_ID = []
    for file_name in files:
        if file_name.split("_")[0] == 'classic':
            for fileG_name in files:
                if fileG_name.split("_")[0] == 'gamified' and file_name.split("_")[2] == fileG_name.split("_")[2]:
                    fileC = os.path.join(drive_folder, file_name)
                    fileG = os.path.join(drive_folder, fileG_name)
                    subject_files_dict[file_name.split("_")[2].split(".")[0]] = [fileC, fileG]
                    subjects_ID.append(file_name.split("_")[2].split(".")[0])
    return subject_files_dict, subjects_ID

def create_subject_dicts(subject_files_dict, subjects_ID): # {'rt_ms': [{} for sub in subjects], 'accuracy': [{} for sub in subjects]}
    variable_dict = {}
    conditions = ['I', 'C', 'N']
    variables = ['rt_ms', 'accuracy']
    for var in variables:
        variable_dict[var] = []
        for id in subjects_ID:
            sub_dict = {'subject_ID': id}
            for con in conditions:
                sub_dict['classic_' + con + '_total'] = []
                sub_dict['gamified_' + con + '_total'] = []
                for i in range(1,5):
                    sub_dict['classic_' + con + "_" + str(i)] = []
                    sub_dict['gamified_' + con + "_" + str(i)] = []
            # scan classic data and calculate means per condition (per session and total)
            with open(subject_files_dict[id][0], newline='', encoding = "utf-8") as classic_file:
                classic_reader = csv.DictReader(classic_file)
                for row in classic_reader:
                    session = row['session']
                    condition = row['condition'][0].upper()
                    val = row[var]
                    if val.strip():
                        sub_dict['classic_' + condition + '_total'].append(float(val))
                        sub_dict['classic_' + condition + "_" + session].append(float(val))
            for con in conditions:
                mean = np.mean(sub_dict['classic_' + con + '_total'])
                sub_dict['classic_' + con + '_total'] = mean
                for i in range(1, 5):
                    mean = np.mean(sub_dict['classic_' + con + "_" + str(i)])
                    sub_dict['classic_' + con + "_" + str(i)] = mean
            #scan gamified data and calculate means per condition (per session and total)
            with open(subject_files_dict[id][1], newline='', encoding = "utf-8") as gamified_file:
                gamified_reader = csv.DictReader(gamified_file)
                for row in gamified_reader:
                    session = row['session']
                    condition = row['condition'][0].upper()
                    val = row[var]
                    if val.strip():
                        sub_dict['gamified_' + condition + '_total'].append(float(val))
                        sub_dict['gamified_' + condition + "_" + session].append(float(val))
            for con in conditions:
                mean = np.mean(sub_dict['gamified_' + con + '_total'])
                sub_dict['gamified_' + con + '_total'] = mean
                for i in range(1, 5):
                    mean = np.mean(sub_dict['gamified_' + con + "_" + str(i)])
                    sub_dict['gamified_' + con + "_" + str(i)] = mean
            variable_dict[var].append(sub_dict)
    return variable_dict

def export_csv_files(variable_dict, file_pathway): #export RT and accuracy raw data to csv file

    output_path = Path(file_pathway)
    output_path.mkdir(parents=True, exist_ok=True)

    for var, rows in variable_dict.items():
        first_col = ['subject_ID']
        all_cols = sorted({key for row in rows for key in row.keys() if key != 'subject_ID'}) if rows else []
        all_cols = first_col + all_cols
        df = pd.DataFrame(rows, columns=all_cols)
        df.to_csv(output_path / f"{var}.csv", index=False)

def export_IMI_data(qualitrics_file, file_pathway): #
    df = pd.read_csv(qualitrics_file)
    cols_to_drop = [f"Q{i}" for i in range(1, 23)]
    df = df.drop(columns=[c for c in cols_to_drop if c in df.columns], errors="ignore")
    df = df.rename(columns={"Q37": "Gender", "Q38": "Age", "Q39": "Experience", "Q41": "Skills"})
    id_col = "Participant_ID"
    version_col = "Task_Version"
    values_cols = [c for c in df.columns if c not in [id_col, version_col]]
    #pivot two rows per subject to one row per subject 
    output = df.pivot(index=id_col, columns=version_col, values=values_cols)
    output.columns = [f"{col.split('_')[-1]}_{ind}" for col, ind in output.columns]
    output = output.reset_index()
    #merging the demographic questions into one answer per subject
    demo_cols = ["Gender", "Age", "Experience", "Skills"]
    for fld in demo_cols:
        fld_cols = [c for c in output.columns if c.startswith(fld + "_")]
        if fld_cols:
            output[fld] = output[fld_cols].bfill(axis=1).iloc[:, 0]
            output = output.drop(columns=fld_cols, errors="ignore")
    #correcting values of demographic
    output["Gender"] = output["Gender"].replace({1.0: "Male", 2.0: "Female"})
    output["Age"] = output["Age"].replace({1.0: "under 18", 2.0: "18-24", 3.0: "25-34", 4.0: "35-44"})
    output["Experience"] = output["Experience"].replace({1.0: "Yes", 2.0: "No"})

    os.makedirs(file_pathway, exist_ok=True)
    out_path = os.path.join(file_pathway, "IMI_demographic_results.csv")
    output.to_csv(out_path, index=False, encoding="utf-8-sig")



## comment out before running the program
#subject_files_dict, subjects_ID = create_subject_files_dict(drive_folder)
#variable_dict = create_subject_dicts(subject_files_dict, subjects_ID)
#export_csv_files(variable_dict, file_pathway)
#export_IMI_data(qualtrics_file, file_pathway)



