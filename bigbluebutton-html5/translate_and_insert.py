import os
import json
from googletrans import Translator

def translate_and_insert(messages, dest_folder, src_lang='en'):
    """
    Translates and inserts messages into JSON locale files by modifying them as plain text.
    This function is idempotent - it will update existing keys rather than duplicating them.

    :param messages: A dictionary of keys and messages to be added, e.g.,
                     {"app.bilduinPlayer.notStarted": "This session has not started yet"}
    :param dest_folder: Path to the folder containing locale JSON files.
    :param src_lang: Source language code for the messages (default: 'en')
    """
    # Initialize the Google Translator
    translator = Translator()

    # Iterate over JSON files in the destination folder
    for filename in os.listdir(dest_folder):
        if filename.endswith('.json'):
            file_path = os.path.join(dest_folder, filename)
            
            # Extract language code from filename (e.g., 'af', 'es_419', etc.)
            locale = filename.split('.')[0]
            
            # Skip translation if the file's locale is the same as the source language
            if locale == src_lang:
                print(f"Skipping translation for {filename} as it matches source language.")
                
                # Still need to add or update the entries in the source file
                try:
                    with open(file_path, 'r', encoding='utf-8') as file:
                        content = json.load(file)
                    
                    # Update content with new messages (no translation needed)
                    for key, message in messages.items():
                        content[key] = message
                    
                    # Write the updated content back to the file
                    with open(file_path, 'w', encoding='utf-8') as file:
                        json.dump(content, file, ensure_ascii=False, indent=4)
                    
                    print(f"Updated {filename} with new entries (no translation needed).")
                except Exception as e:
                    print(f"Error updating {filename}: {e}")
                
                continue
            
            try:
                # Load the file as proper JSON for idempotent updates
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = json.load(file)
                
                # Keep track of which keys are updated
                updated_keys = []
                
                # Process each message
                for key, message in messages.items():
                    # Translate the message
                    try:
                        translated_text = translator.translate(message, src=src_lang, dest=locale).text
                        
                        # Update or add the key
                        if key in content:
                            if content[key] != translated_text:
                                content[key] = translated_text
                                updated_keys.append(f"{key} (updated)")
                        else:
                            content[key] = translated_text
                            updated_keys.append(f"{key} (added)")
                    except Exception as e:
                        print(f"Error translating {key} for {filename}: {e}")
                        continue
                
                # Save the updated content back to the file
                if updated_keys:
                    with open(file_path, 'w', encoding='utf-8') as file:
                        json.dump(content, file, ensure_ascii=False, indent=4)
                    
                    print(f"Updated {filename} with entries: {', '.join(updated_keys)}")
                else:
                    print(f"No changes needed for {filename}")
                    
            except json.JSONDecodeError:
                print(f"Error: Could not parse {filename} as valid JSON. Skipping.")
            except Exception as e:
                print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    # Example usage
    messages_to_add = {
        "app.bilduinPlayer.notStarted": "Diese Sitzung hat noch nicht begonnen. Der geplante Beginn ist um {0}.",
    }

    # destination_folder = "/your/path/here/bigbluebutton-html5/public/locales/"
    destination_folder = "./public/locales/"

    # Use with default source language (English)
    # translate_and_insert(messages_to_add, destination_folder)
    
    # Or specify a different source language
    translate_and_insert(messages_to_add, destination_folder, src_lang='de')