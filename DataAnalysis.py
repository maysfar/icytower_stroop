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
                    subject_files_dict[file_name.split("_")[2]] = [fileC, fileG]
                    subjects_ID.append(file_name.split("_")[2])
    return subject_files_dict, subjects_ID

def create_subject_dicts(subject_files_dict, subjects_ID): # {'rt_ms': [{} for sub in subjects], 'accuracy': [{} for sub in subjects]}
    variable_dict = {}
    conditions = ['I', 'C', 'N']
    variables = ['rt_ms', 'accuracy']
    for var in variables:
        variable_dict[var] = []
        for id in subjects_ID:
            sub_dict = {}
            sub_dict['subject_ID'] = id
            for con in conditions:
                sub_dict['classic_' + con + '_total'] = []
                sub_dict['gamified_' + con + '_total'] = []
                for i in range(1,7):
                    sub_dict['classic_' + con + "_" + str(i)] = []
                    sub_dict['gamified_' + con + "_" + str(i)] = []
            # scan classic data and calculate means per condition (per session and total)
            with open(subject_files_dict[id][0], newline='', encoding = "utf-8") as classic_file:
                classic_reader = csv.DictReader(classic_file)
                for row in classic_reader:
                    session = row['session']
                    condition = row['condition'][0].upper()
                    sub_dict['classic_' + condition + '_total'].append(row[var])
                    sub_dict['classic_' + condition + "_" + session].append(row[var])
            for con in conditions:
                sub_dict['classic_' + con + '_total'] = np.mean(sub_dict['classic_' + con + '_total'])
                for i in range(1, 7):
                    sub_dict['classic_' + con + "_" + str(i)] = np.mean(sub_dict['classic_' + con + "_" + str(i)])
            #scan gamified data and calculate means per condition (per session and total)
            with open(subject_files_dict[id][1], newline='', encoding = "utf-8") as gamified_file:
                gamified_reader = csv.DictReader(gamified_file)
                for row in gamified_reader:
                    session = row['session']
                    condition = row['condition'][0].upper()
                    sub_dict['gamified_' + condition + '_total'].append(row[var])
                    sub_dict['gamified_' + condition + "_" + session].append(row[var])
            for con in conditions:
                sub_dict['gamified_' + con + '_total'] = np.mean(sub_dict['gamified_' + con + '_total'])
                for i in range(1, 7):
                    sub_dict['gamified_' + con + "_" + str(i)] = np.mean(sub_dict['gamified_' + con + "_" + str(i)])
        variable_dict[var].append(sub_dict)
    return variable_dict

def export_csv_files(variable_dict, file_pathway):

    output_path = Path(file_pathway)
    output_path.mkdir(parents=True, exist_ok=True)

    for var, rows in variable_dict.items():
        all_cols = sorted({key for row in rows for key in row.keys()}) if rows else []
        df = pd.DataFrame(rows, columns=all_cols)
        df.to_csv(output_path / f"{var}.csv", index=False)








