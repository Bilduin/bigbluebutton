import os
from googletrans import Translator

def translate_and_insert(messages, dest_folder):
    """
    Translates and inserts messages into JSON locale files by modifying them as plain text.

    :param messages: A dictionary of keys and messages to be added, e.g.,
                     {"app.bilduinPlayer.notStarted": "This session has not started yet"}
    :param dest_folder: Path to the folder containing locale JSON files.
    """
    # Initialize the Google Translator
    translator = Translator()

    # Iterate over JSON files in the destination folder
    for filename in os.listdir(dest_folder):
        if filename.endswith('.json'):
            file_path = os.path.join(dest_folder, filename)
            
            # Extract language code from filename (e.g., 'af', 'es_419', etc.)
            locale = filename.split('.')[0]

            # Read the file as plain text
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()

            # Find the last closing brace
            last_brace_index = content.rfind('}')
            if last_brace_index == -1:
                print(f"Error: Could not find a valid JSON structure in {filename}.")
                continue

            # Prepare the new messages to add
            new_entries = []
            for key, message in messages.items():
                # Translate the message
                try:
                    translated_text = translator.translate(message, dest=locale).text
                except Exception as e:
                    print(f"Error translating {key} for {filename}: {e}")
                    continue

                # Format the new entry
                new_entry = f'    "{key}": "{translated_text}"'
                new_entries.append(new_entry)

            # Construct the new content
            if new_entries:
                # Find the last comma before the closing brace
                last_comma_index = content[:last_brace_index].rfind(',')

                # Check if the last character before the closing brace is a comma
                if last_comma_index != -1 and content[last_comma_index + 1:last_brace_index].strip() == '':
                    # Remove the trailing comma to avoid JSON errors
                    content = content[:last_comma_index] + content[last_comma_index + 1:]

                # Insert the new entries before the closing brace
                new_content = content[:last_brace_index].rstrip() + ',\n' + ',\n'.join(new_entries) + '\n}'

                # Save the updated file
                with open(file_path, 'w', encoding='utf-8') as file:
                    file.write(new_content)

                print(f"Added new entries to {filename}: {new_entries}")

if __name__ == "__main__":
    # Example usage
    messages_to_add = {
        "app.bilduinPlayer.notStarted": "This session has not started yet",
        "app.bilduinPlayer.ended": "This session has ended"
    }
    destination_folder = "/your/path/here/bigbluebutton-html5/public/locales/"

    translate_and_insert(messages_to_add, destination_folder)
