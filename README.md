my personal assistant which does nothing expect giving advice by copy pasting from internet

just like me :)

jarvis-backend.sh file contains the bash command to start the server on port 9565 and the script's path is added in crontab which runs on reboot

command:
`crontab -e`
and add
`@reboot /path/to/script/`

next todo:
1) make input area multiline when input is long
2) add a copy response button or make the response selectable
3) make it understand follow up questions
4) provide internet access 

huge update:
make it local
