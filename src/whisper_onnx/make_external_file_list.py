import os

os.chdir("src/whisper_onnx")

def create_file_list(directory):
    with open(f"{directory}.txt", 'w') as filelist:
        for filename in os.listdir(directory):
            if not filename.endswith('.onnx'):
                filelist.write(f"{filename}\n")

directory = './large-v2'
create_file_list(directory)
