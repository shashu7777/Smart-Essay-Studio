from langgraph.graph import StateGraph, START, END
from typing import TypedDict
from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
import os

load_dotenv()
google_api_key=os.getenv("GOOGLE_API_KEY")


class ESSAYState(TypedDict):
    current_topic: str
    previous_topic:list
    essay: str
    feedback: str
    
    
graph=StateGraph(ESSAYState)


model=ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    tmeperature=0.7,
    google_api_key=google_api_key
) 

parser=StrOutputParser()
 
def generate_topic(state:ESSAYState)->ESSAYState:
    prompt=PromptTemplate(
        input_variables=['topic_list'],
        template='''Generate a unique essay topic. 
                                      The topic should not repeat any previously given topics- {topic_list}. 
                                      Rotate across different sections such as Technology, Environment, Education, Health, Society, and Ethics. 
                                      Return the topic as a short, clear title string.''')
    
    chain= prompt | model | parser
    
    topic= chain.invoke({'topic_list':state['previous_topic']})
    state['current_topic']=topic
    state['previous_topic'].append(topic)
    return state
    
 
 
 
 
def analyse_essay(state:ESSAYState)->ESSAYState:
    topic=ESSAYState['current_topic']
    essay=ESSAYState['essay']
    
    
    prompt=PromptTemplate(
        input_variables=['topic', 'essay'],
        template='''  You are an essay evaluator. You will be given:
                   1. A topic
                   2. A student-written essay

                    Your task:
                    - Check if the essay is written in the correct essay format (introduction, body, conclusion, relevance to the topic).
                    - Evaluate grammar, coherence, structure, creativity, and relevance.
                    - If the essay is perfect, reply only with:
                        "Perfect. Score: 100/100"
                    - Otherwise, give:
                        - A numeric score out of 100
                        - A detailed and constructive feedback section
                        - Feedback must highlight only the **important improvement areas in bold** (e.g., **Improve grammar**, **Strengthen conclusion**) while the explanation itself remains normal text.

                    Make the feedback comprehensive, analytical, and encouraging so the student clearly understands what to improve.

                    ---
                    Topic: {topic}
                    Essay: {essay}''')
    
    chain= prompt | model | parser
    
    feedback=chain.invoke({'topic':state['current_topic'],'essay':state['essay']})
    state['feedback']=feedback
    return state




def route_start(state: ESSAYState):
    """Route based on whether current_topic exists"""
    if not state.get("current_topic"):  
        return "generate_topic"
    else:
        return "analyse_essay"


graph.add_node('generate_topic', generate_topic)
graph.add_node('analyse_essay',analyse_essay)


# Instead of fixed edges, add conditional branch from START
graph.add_conditional_edges(
    START,
    route_start,  # function decides where to go
    {
        "generate_topic": "generate_topic",
        "analyse_essay": "analyse_essay"
    }
)

# Then connect each to END
graph.add_edge("generate_topic", END)
graph.add_edge("analyse_essay", END)

essay_graph=graph.compile()


   
    
if __name__=="__main__":
    pass
        
    
    