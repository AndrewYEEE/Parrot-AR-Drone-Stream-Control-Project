var express   = require('express')
  , app       = express()
  , server    = require('http').createServer(app)

app.use(express.static(__dirname + '/public'));
app.use(app.router);
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});

/*
app.get('/phone', function(req, res) {
  res.sendfile(__dirname + '/phone.html');
});
*/
server.listen(8084);
//require("dronestream").listen(server); //開啟video串流server讓影像可流至html

//===============================飛往特定GPS定點必要設定、video設定==========================================
var arDrone  = require('ar-drone');
var PID      = require('./PID');
var vincenty = require('node-vincenty');
var yawPID = new PID(1.0, 0, 0.30);
var client = arDrone.createClient();
var shell = require("shelljs");
var child=require("child_process");
var LiveBool=true;


//var video = arDrone.createClient().getVideoStream();


//dronestream.pipe(parser);
client.config('general:navdata_demo', 'FALSE'); //drone回傳資料設定
//client.config('control:altitude_max', 6000);    //最大高度設定
//client.config('control:altitude_min', 3000);    //最低高度設定
//client.config('detect:detect_type', 12);        
//client.config('video:video_channel', 0);    //video_channel設定

//=======================================================

var io  = require('socket.io').listen(server) //設定允許server與html傳遞資料
io.set('destroy upgrade', false)
io.sockets.on('connection', function(socket) {
            console.log('Socket connection.')

            socket.on('control', function(ev) { 
                        console.log('[control]', JSON.stringify(ev)); 
                        if(ev.action == 'animate'){
                                client.animate(ev.animation, ev.duration)
                        } else {
                                client[ev.action].call(client, ev.speed);
                        }
            })
            socket.on('takeoff', function(){
                        console.log('takeoff................')
                        client.takeoff()     
            })  
            
            socket.on('land', function(){
                        console.log('land.................')
                        client.land()
            })
            
            socket.on('reset', function(){
                        console.log('reset....................')
                        client.disableEmergency()
            })
            /*
            socket.on('phone', function(data){
                        console.log('phone', data)
                        targetLat = data.lat
                        targetLon = data.lon
                        phoneAccuracy = data.accuracy
            })*/  
            socket.on('stop', function(){               
                        stop();
                        //stop()       
            })
            var stop = function(){
                console.log('stop..............................')
                targetYaw = null
                targetLat = null
                targetLon = null
                client.stop()
            }
            socket.on('go', function(data){
                        targetLat = data.lat
                        targetLon = data.lon
                        
                        //==============================
                        /*
                        if (targetLat == null || targetLon == null || currentYaw ==  null || currentLat == null || currentLon == null) return; //若無下"go"指令
                                console.log('go Command is Operated!!_____', data,currentLat,currentLon)
                                var bearing = vincenty.distVincenty(currentLat, currentLon, targetLat, targetLon) //取得與目標之間的所有資訊

                                if(bearing.distance > 1){
                                            currentDistance = bearing.distance //從算出的資訊(bearing)中取出距離
                                            console.log('distance', bearing.distance)
                                            console.log('bearing:', bearing.initialBearing)
                                            targetYaw = bearing.initialBearing //從算出的資訊(bearing)中取出與目標的相對角度

                                            console.log('currentYaw:', currentYaw);
                                            var eyaw = targetYaw - currentYaw; //計算drone與目標的夾角
                                            console.log('eyaw:', eyaw);

                                            var uyaw = yawPID.getCommand(eyaw); //換算旋轉的時間
                                            console.log('uyaw:', uyaw);

                                            var cyaw = within(uyaw, -1, 1); //修正最大時間範圍
                                            console.log('cyaw:', cyaw);

                                            client.clockwise(cyaw) 
                                            client.front(0.05) //speed control
                                } else {
                                            targetYaw = null
                                            io.sockets.emit('waypointReached', {lat: targetLat, lon: targetLon})
                                            console.log('Reached ', targetLat, targetLon)
                                            stop() //執行stop函式，寫在下面
                                }
                        */
            })
            socket.on('up', function(){
                        console.log('up.................................')
                        client.up(0.5)
            }) 
            socket.on('front', function(){
                        console.log('front..............................')
                        client.front(0.1)
            })
            socket.on('back', function(){
                        console.log('back..............................')
                        client.back(0.1)
            })
            socket.on('left', function(){
                        console.log('left..............................')
                        client.left(0.1)
            })
            socket.on('right', function(){
                        console.log('right..............................')
                        client.right(0.1)
            })
            socket.on('down', function(){
                        console.log('down..............................')
                        client.down(0.1)
            })
            socket.on('clockwise', function(){
                        console.log('clockwise..............................')
                        client.clockwise(0.1)
            })
            socket.on('counterClockwise', function(){
                        console.log('counterClockwise..............................')
                        client.counterClockwise(0.1)
            })
            socket.on('Live', function(){
                        console.log('Livestart..............................')
                        //shell.exec("node RTMP_video.js | ffmpeg -f h264 -i - -vcodec copy -acodec copy -f flv rtmp://140.125.45.186:1935/hls/12345678");
                        /*var c=child.fork('./RTMP_video.js | ffmpeg -f h264 -i - -vcodec copy -acodec copy -f flv rtmp://140.125.45.187:1935/hls/12345678');
                        c.on('message',function(m){
                                console.log(m);
                        })
                        */
                        var c=child.exec('node ./RTMP_video.js | ffmpeg -f h264 -i - -vcodec copy -acodec copy -f flv rtmp://140.125.45.187:1935/hls/12345678', function(err, stdout, stderr) {
                                console.log(stdout);
                                console.log(stderr);
                        });

            })

            setInterval(function(){  //設定幾秒傳一次資料給要接收此資料的html
                        console.log('Sanding Drone Data to index.html....')
                        io.sockets.emit('drone', {lat: currentLat, lon: currentLon, yaw: currentYaw, distance: currentDistance, battery: battery,z:zVe})
                        //io.sockets.emit('phone', {lat: targetLat, lon: targetLon, accuracy: phoneAccuracy})
                        /*
                        if(parseFloat(zVe)<60)
                        {
                                console.log('up')
                                client.up(1)
                        }
                        else if(parseFloat(zVe)>60)
                        {
                                console.log('down')
                                client.down(1)
                        }*/
            },1000) //設定3秒
  
});





//=======================================================

var targetLat, targetLon, targetYaw, cyaw, currentLat, currentLon,currentDistance, currentYaw, phoneAccuracy;
var battery,zVe;
var fs = require('fs'); //引入檔案系統，將video存到電腦中需要這個

//==========================主要處理drone資料與運算區塊========================================================
var handleNavData = function(data){   //解析取到的data
                //console.log("Recevied data!!");
                //console.log(data);
                if ( data.demo == null){
                                console.log("Can't get Drone Data!!");
                                return;
                }//若無取到任何資料，則終結函式
                //==============取基本資料=============
                battery = data.demo.batteryPercentage     //擷取飛行器電池資訊
                currentYaw = data.demo.rotation.yaw;      //擷取飛行器現在的角度(例如北邊是0度，南邊是180度)
                if(data.gps == null){
                                console.log("GPS data Lose!!");
                                return;
                }
                currentLat = data.gps.latitude            //擷取飛行器經度
                currentLon = data.gps.longitude           //擷取飛行器緯度
                zVe =data.gps.elevation                   //擷取飛行器Z軸資訊
                //=====================================
                if (targetLat == null || targetLon == null || currentYaw ==  null || currentLat == null || currentLon == null) return;

                var bearing = vincenty.distVincenty(currentLat, currentLon, targetLat, targetLon)

                if(bearing.distance > 1){
                        console.log("GO Function Operating!!");
                        currentDistance = bearing.distance
                        console.log('distance', bearing.distance)
                        console.log('bearing:', bearing.initialBearing)
                        targetYaw = bearing.initialBearing

                        console.log('currentYaw:', currentYaw);
                        var eyaw = targetYaw - currentYaw;
                        console.log('eyaw:', eyaw);

                        var uyaw = yawPID.getCommand(eyaw);
                        console.log('uyaw:', uyaw);

                        var cyaw = within(uyaw, -1, 1);
                        console.log('cyaw:', cyaw);

                        client.clockwise(cyaw)
                        client.front(0.05)
                } else {
                        targetYaw = null
                        io.sockets.emit('waypointReached', {lat: targetLat, lon: targetLon})
                        console.log('Reached ', targetLat, targetLon)
                        stop()
                }       
                
}

client.on('navdata', handleNavData);  //擷取drone的所有資料(data)(會一直抓)(handleNavData是一個function)

var stop = function(){
            console.log('Stop Command is Operated!!_____', data)
            targetYaw = null
            targetLat = null
            targetLon = null
            client.stop()
}

function within(x, min, max) {
  if (x < min) {
      return min;
  } else if (x > max) {
      return max;
  } else {
      return x;
  }
}
