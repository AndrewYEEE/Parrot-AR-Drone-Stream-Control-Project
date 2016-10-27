
# Parrot-AR-Drone-Stream-Control-Project
Parrot AR Drone 飛控專案(配合Hbase、與自行撰寫的手機控制端Android、nginx server(需rtmp plugin))

###使用方式:
1.先連結AR drone2.0
2.開啟終端機，到該目錄下執行 node redj.js
3.開啟瀏覽器輸入localhost:8084即可看到相對應的飛控畫面
4.利用我另一個專案的Android控制端來操作、運行串流

作品展示:

重要檔案:
redj.js: nodejscode，是用來運行server端程式，使用socketio連結前端
index.html: html+javascript+socketio，負責與redj.js溝通，屬於前端
RTMP_video.js:用於將drone影像串流至nginx rtmp server.
