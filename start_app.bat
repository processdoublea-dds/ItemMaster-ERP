@echo off
TITLE Item Master Generator Server
echo ---------------------------------------------------
echo  Starting Item Master Generator...
echo  Please keep this window open while using the app.
echo ---------------------------------------------------

:: Open the browser
start http://localhost:3000

:: Start the server
node server.js

pause
