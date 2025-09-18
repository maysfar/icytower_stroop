# icytower_stroop
A web-based experiment that gamifies the Stroop cognitive task inside an Icy Tower- style platformer.
Built with Phaser 3, jQuery, Vite, and integrated with Qualtrics for data collection.

# Overview
Participants complete two versions of the Stroop task:
    -Classic version - traditional text-based Stroop (press R/G/B keys)
    -Gamified version - a platformer where the player must jump to the correct platform matching the ink color of a word.

The experiment measures RT and accuracy, and exports results as csv files for later analysis.
After each task, participants are redirected to Qualtrics for questionnaires.

# Getting Started

1. Clone the repository
    'git clone https://github.com/maysfar/icytower_stroop.git'

    'cd icytower_stroop'

2. Install dependencies
    'npm install'

3. Run development server
    'npm run dev'

    Then open the printed local URL in your browser.

# Project Structure
- index.html - Consent + Participant ID entry.
- classic.html - Classic Stroop task.
- game.html - Gamified Stroop.
- end.html - Final thank-you screen.
- qualtrics.html - Redirect back to Qualtrics survey.
- main.js - Main Phaser game logic.
- exportCSV.js - Exports trial data to CSV / cloud.
- DataSamplesAndAnalysis - folder contains the code for the offline data analysis code (DataAnalysis.py), and example csv files.