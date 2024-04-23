my personal assistant which does nothing expect giving advice by copy pasting from internet
just like me :)

it uses websocket to stream response, calls the local LLM (llama3 8b) running using ollama if offline, otherwise calls llama3 70b using groq api and providing search results using exa-js.

jarvis-backend.sh file contains the bash command to start the server on port 9565 and the script's path is added in crontab which runs on reboot

command:
`crontab -e`
and add
`@reboot /path/to/script/`

next todo:
1) make input area multiline when input is long
2) make the response area scrollable
3) add a copy response button or make the response selectable
4) make it understand follow up questions
5) close the websocket connection after closing the popup 
