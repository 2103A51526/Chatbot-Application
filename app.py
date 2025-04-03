import re
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
import json
import random
import os
import nltk
from nltk.corpus import stopwords, wordnet
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import logging
from flask_cors import CORS

# Ensure nltk packages are downloaded
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize lemmatizer and load stop words
lemmatizer = WordNetLemmatizer()
STOP_WORDS = set(stopwords.words('english'))

# Load the knowledge base from JSON
def load_knowledge_base(file_path='knowledge_base.json'):
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            return json.load(file)
    return {}

knowledge_base = load_knowledge_base()

def process_input(user_input):
    lines = user_input.strip().splitlines()  # Split input into multiple lines
    processed_lines = []

    for line in lines:
        tokens = word_tokenize(line.lower())  # Tokenize and lowercase the input
        filtered_tokens = [
            lemmatizer.lemmatize(word) for word in tokens if word.isalnum() and word not in STOP_WORDS
        ]
        processed_lines.append(' '.join(filtered_tokens))

    return processed_lines

# Function to find synonyms using WordNet
def get_synonyms(word):
    synonyms = set()
    for synset in wordnet.synsets(word):
        for lemma in synset.lemmas():
            synonyms.add(lemma.name())
    return synonyms

# Function to process user input with WordNet (get synonymous queries)
def get_synonym_query(user_input):
    lines = user_input.strip().splitlines()  # Split input into multiple lines
    all_synonym_queries = []

    for line in lines:
        tokens = word_tokenize(line.lower())
        synonym_queries = []

        for word in tokens:
            if word not in STOP_WORDS and word.isalnum():
                # Get synonyms for the word
                synonyms = get_synonyms(word)
                synonym_queries.append(synonyms if synonyms else {word})

        # Create all combinations of synonyms (cross product)
        from itertools import product
        line_combinations = product(*synonym_queries)
        processed_synonyms = [' '.join(combo) for combo in line_combinations]
        all_synonym_queries.extend(processed_synonyms)

    return all_synonym_queries

# Function to respond to the user's query
def get_response(user_input, knowledge_base):
    user_input = user_input.lower()

    # Check if the user input contains the keyword "student"
    if 'student' in user_input:
        return "Please type the **student information**."

    if re.search(r'\b(today|current|date)\b', user_input):
        return f"Today's date is {datetime.now().strftime('%Y-%m-%d')}"

    # Generate synonym variants for user input
    processed_input_variants = get_synonym_query(user_input)

    # Check all possible synonym variants in the knowledge base
    for variant in processed_input_variants:
        if variant in knowledge_base:
            return random.choice(knowledge_base[variant])  # Select a random response

    # Check if the original user input exists in the knowledge base
    processed_inputs = process_input(user_input)
    for processed_input in processed_inputs:
        if processed_input in knowledge_base:
            return random.choice(knowledge_base[processed_input])  # Select a random response

    return None

# Function to update the knowledge base with multiple answers for the same query
def update_knowledge_base(user_input, answer, knowledge_base):
    processed_inputs = process_input(user_input)  # Cleaned input
    for processed_input in processed_inputs:
        if processed_input in knowledge_base:
            knowledge_base[processed_input].extend(answer.splitlines())  # Append new answers
        else:
            knowledge_base[processed_input] = answer.splitlines()  # Store as a list of strings
    save_knowledge_base(knowledge_base)

# Function to save the knowledge base
def save_knowledge_base(knowledge_base, file_path='knowledge_base.json'):
    with open(file_path, 'w') as file:
        json.dump(knowledge_base, file, indent=4)

# Define a route for handling user queries
@app.route('/ask', methods=['POST'])
def ask():
    try:
        user_input = request.json.get('user_input')
        response = get_response(user_input, knowledge_base)

        if response:
            return jsonify({'response': response})
        else:
            return jsonify({'unknown': True})  # Indicate that the answer is unknown
    except Exception as e:
        logging.error(f"Error processing request: {e}")
        return jsonify({'error': 'An error occurred while processing your request.'}), 500

# Define a route for updating the knowledge base with user-provided answers
@app.route('/update-knowledge', methods=['POST'])
def update_knowledge():
    try:
        user_input = request.json.get('user_input')
        answer = request.json.get('new_answer')

        if user_input and answer:
            update_knowledge_base(user_input, answer, knowledge_base)
            return jsonify({'response': 'Thank you! I have learned that.'})

        return jsonify({'response': 'Invalid input. Please provide both user_input and answer.'})
    except Exception as e:
        logging.error(f"Error updating knowledge base: {e}")
        return jsonify({'error': 'An error occurred while updating the knowledge base.'}), 500

# Serve the HTML file
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

# Serve the JavaScript file
@app.route('/script.js')
def send_js():
    return send_from_directory('.', 'script.js')


@app.route('/speech.js')
def send_speech_js():
    return send_from_directory('.', 'speech.js')

@app.route('/styles.css')
def send_css():
    return send_from_directory('.', 'styles.css')

@app.route('/icon.css')
def send_icon_css():
    return send_from_directory('.', 'icon.css')

# Load student information from JSON file
def load_student_data(filename):
    with open(filename, 'r') as file:
        return json.load(file)

# Load student data from JSON file
students_data = load_student_data('students.json')

# Function to fetch student information by roll number
def fetch_student_info(roll_no, student_data):
    for student in student_data:
        if student['roll_no'] == roll_no:
            return student
    return None

# API endpoint to get student info
@app.route('/api/students/<roll_no>', methods=['GET'])
def get_student(roll_no):
    print(f"Fetching info for roll number: {roll_no}")  # Debugging line
    student_info = fetch_student_info(roll_no, students_data)
    if student_info:
        return jsonify(student_info), 200
    else:
        return jsonify({"error": "Student not found"}), 404
    
# Load faculty data from JSON file
def load_faculty_data(filename):
    with open(filename, 'r') as file:
        return json.load(file)

# Load faculty data
faculty_data = load_faculty_data('faculty_details.json')

# Function to fetch faculty information by name
def fetch_faculty_info(faculty_name, faculty_data):
    for faculty in faculty_data:
        if faculty_name.lower() == faculty['Name'].lower():  # Case-insensitive matching
            return faculty
    return None

@app.route('/api/faculty/<faculty_name>', methods=['GET'])
def get_faculty(faculty_name):
    print(f"Fetching info for faculty: {faculty_name}")  # Debugging line
    faculty_info = fetch_faculty_info(faculty_name, faculty_data)
    if faculty_info:
        return jsonify(faculty_info), 200
    else:
        return jsonify({"error": "Faculty not found"}), 404

# Define an API endpoint to get all faculty details
@app.route('/api/faculty', methods=['GET'])
def get_all_faculty():
    try:
        # Load the faculty data
        faculty_data = load_faculty_data('faculty_details.json')
        
        # Create a list with just Name and Designation for each faculty member
        faculty_summary = [
            {'Name': faculty['Name'], 'Designation': faculty['Designation']} for faculty in faculty_data
        ]
        
        return jsonify(faculty_summary), 200  # Return the faculty summary
    except Exception as e:
        logging.error(f"Error fetching all faculty: {e}")
        return jsonify({'error': 'An error occurred while fetching all faculty details.'}), 500


# Main entry point
if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    app.run(debug=True)
