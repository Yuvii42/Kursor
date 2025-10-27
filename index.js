import { GoogleGenAI} from "@google/genai";
import readlineSync from 'readline-sync';

import {exec} from "child_process";
import { promisify } from "util";

import os from 'os';

const platform = os.platform();

const asyncExecute = promisify(exec);

const History = [] 

const ai = new GoogleGenAI({apiKey: "AIzaSyAL2RcVgkrGVd88_z_SW7dTuhmmQLWvqA8"})


// We will first create a tool, that we actually help us to run terminal commands

async function executeCommand({command}){
    try {
        const {stdout, stderr} = await asyncExecute(command);
        if(stderr){
            return `Error: ${stderr}`; 
        }
        return `Success: ${stdout} || Task Exceuted completely`;
    } catch (error) {
        return `Error: ${error}`
        
    }
}



const executeCommandDecleration = {
    name: "executeCommand",
    description:"Execute a single terminal/shell command and A command can be to create a folder, file, write on a file, edit the file or delete from the file.",
    parameters:{
        type:'OBJECT',
        properties:{
            command:{
                type:'STRING',
                description: "It will be a single terminal command Example: 'mkdir testFolder' or 'echo Hello World > testFile.txt' or 'rm testFile.txt' or 'rmdir testFolder'"
            },
        },
        required: ['command']
    }
}

const availableTools = {
    executeCommand
}


async function runAgent(userProblem){
    History.push({
        role:'user',
        parts:[{text:userProblem}]
    });

    while(true){
            const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: History,
    config: {
        systemInstruction: `You are an website builder AI assistent. You have to create a frontend of the website based on the user requirements. You have access to a tool that can help you to execute terminal commands on the system. Use the tool whenever you need to create, edit or delete any files or folders. Always think step by step and break down the tasks into smaller sub-tasks. Use the tool to execute terminal commands to complete each sub-task one by one.
        
        Current user operation system is: ${platform}
        Give command to the user according to its operating system support.

        <------- What is your job ------->
        1: Analyze the user query to see what kind of website they want to build.
        2: Give them command one by one, step by step.
        3: Use available tool executeCommand

        //Now you can give them command in following below:
        1: First create a folder ExL mkdir "calculator"
        2: Inside the folder, create index.html, Ex: touch "Calculator/index.html
        3: Then create style.css same as above.
        4: Then create scripts.js
        5: Then write a code in html file

        You have to provide the terminal or shell command to user, they will directly exceute it.

        `,
        tools: [{
            functionDeclaration: [executeCommandDecleration]
        }],
        },
    });

    if(response.functionCalls&&response.functionCalls.length>0){
        console.log(response.functionCalls[0]);
        const {name,args} = response.functionCalls[0];

        const functionResponsePart = {
            name: name,
            response: {
                result: result,
            },
        };

        //model
        History.push({
            role: "model",
            parts: [
                {
                    functionCall: response.functionCalls[0],
                },
            ],
        });

        //Putting result in history
        History.push({
            role: "user",
            parts: [
                {
                  functionResponse: functionResponsePart,  
                },
            ],
        });
        
    }else{
        History.push({
            role:'model',
            parts:[{text:response.text}]
        })
        console.log(response.text);
        break
        
    }
    }
}

async function main(){
    console.log("Welcome to Kursor - Your AI-Powered Terminal Assistant!");
    const userProblem = readlineSync.question("Please describe the website you want to build: ");
    await runAgent(userProblem);
    main();
}

main();
