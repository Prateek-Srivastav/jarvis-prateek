my personal assistant which does nothing expect giving advice by copy pasting from internet

just like me :)

jarvis-backend.sh file contains the bash command to start the server on port 9565 and the script's path is added in crontab which runs on reboot
`crontab -e`

and add
`@reboot path/to/script/`
