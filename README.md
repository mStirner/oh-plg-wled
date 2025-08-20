# Introduction
Discover, add & control WLED devices

# Installation
1) Create a new plugin over the OpenHaus backend HTTP API
2) Mount the plugin source code folder into the backend
3) run `npm install`

# Development
Add plugin item via HTTP API:<br />
[PUT] `http://{{HOST}}:{{PORT}}/api/plugins/`
```json
{
   "name":"WLED Integration",
   "version": "1.0.0",
   "intents":[
      "devices",
      "endpoints",
      "mdns"
   ],
   "uuid": "e0f59a54-cb97-4199-8a1b-dfed5ea680ac"
}
```

Mount the source code into the backend plugins folder
```sh
sudo mount --bind ~/projects/OpenHaus/plugins/oh-plg-wled/ ~/projects/OpenHaus/backend/plugins/e0f59a54-cb97-4199-8a1b-dfed5ea680ac/
```
