from flask import Flask, request, jsonify
from flask_cors import CORS
from model import essay_graph

app=Flask(__name__)

CORS(app)

@app.route('/generate_topic', methods=['GET'])
def generate_topic():
    
    topic_file= open(r'D:\topics/topics.txt', 'r')
    topics_list= topic_file.read().split(',')

    topic=essay_graph.invoke({'current_topic':"", 'previous_topic':topics_list, 'essay':"", 'feedback':""})
    print(topic)
    
    if len(topics_list)==5:
            topic_file= open(r'D:\topics/topics.txt', 'w')
            topic_file.write(topic['current_topic'])
            
    else:
         topic_file= open(r'D:\topics/topics.txt', 'a')
         if topics_list[0]=='':
            print("lll")
            topic_file.write(topic['current_topic'])
            topic_file.close()
            
         else:
            topic_file.write(", "+topic['current_topic']) 
            topic_file.close()
    
    return jsonify({'topic':topic['current_topic']})




@app.route('/analyse_essay', methods=['POST'])
def analyse_essay():
    response=request.get_json()
    print(response)
    topic=response.get('topic')
    essay=response.get('essay')
    print(response)
    feedback=essay_graph.invoke({'current_topic':topic, 'previous_topic':[], 'essay':essay, 'feedback':""})
    print(feedback)
    
    return jsonify({'feedback':feedback['feedback']})




if __name__=="__main__":
    app.run(debug=True)

    
