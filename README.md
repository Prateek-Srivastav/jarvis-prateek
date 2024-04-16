my personal assistant which does nothing expect giving advice by copy pasting from internet

just like me :)

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
5) provide internet access (now have access but need optimization)

huge update:
make it local
