var express = require('express');
var fs = require("fs-extra");
var router = express.Router();

router.get('/users', function (req, res) {
	res.render('users',{
		title:"Users API"
	});
	
});

/*
POST registerUser recieve data:{"email":""}
if error occured return status 0
if user register return status 1 
if user exist return status 2 
return json {"uid":"","status":0-2,"desc":""}
*/
router.post("/users/registerUser", function(req, res) {
    try{
    	var data = JSON.parse(req.body.data); 
        //safe:true , fsync: true
        if (data.email && data.email!="")
        MongoClient.connect(config.mongoUrl, {native_parser:true}, function(err, db) {
            var r={};
            if (err) {
                console.log("query error ",err);
                r.uid=0;
                r.status=0;
                r.desc="err db";
                res.send(lecturusCallback(JSON.stringify(r)))
                return;
            }
            var collection = db.collection('users');
            collection.find({email:data.email}).toArray(function (err, docs) {
                if (!docs.length)
                    collection.insert(data, {upsert:true, safe:true , fsync: true}, function(err, result) {
                        console.log("register",data.email);
                        r.uid=data.email;
                        r.status=1;
                        r.desc="register";
                        db.close();
                        res.send(lecturusCallback(JSON.stringify(r)))
                    });
                else
                     collection.update({email:data.email},data, {upsert:true ,safe:true , fsync: true}, function(err, result) { 
                        console.log("exist",data.email);
                        r.uid=data.email;
                        r.status=2;
                        r.desc="exist";
                        db.close();
                        res.send(lecturusCallback(JSON.stringify(r)))
                     });
            });
        });
        else{
            r.status=0;
            r.desc="uid error";
            res.send(lecturusCallback(JSON.stringify(r)));     
        }
    }catch(err){
        r.status=0;
        r.desc="data error";
    	res.send(lecturusCallback(JSON.stringify(r)));
    }
    
           
});
/*
    console.log("registerUser -- "+data)
    pool.getConnection(function (err, connection) {
    	if(err) { console.log(err); return; }
    	connection.query('INSERT INTO `'+config.database+'`.`user` SET ?', data, function (err, result){
	    	var r={};
	    	if (err != null && err.code == 'ER_DUP_ENTRY') {
	    		console.log("exist",data.email);
    			r.uid=data.email;
    			r.status=2;
    			r.desc="exist";
	    		res.send(lecturusCallback(JSON.stringify(r)))
	    	}
	    	else if (err == null) {
	    		console.log("register",data.email);
	    		r.uid=data.email;
    			r.status=1;
    			r.desc="register";
	    		res.send(lecturusCallback(JSON.stringify(r)))
	    	}
	    	else {
	    		console.log("query error ",err);
	    		r.uid=0;
    			r.status=0;
    			r.desc="err";
	    		res.send(lecturusCallback(JSON.stringify(r)))
	    	}
    	});
	    connection.end();
    });

});*/

/*
POST getUser by id recieve {data:email} 
if fail return {status:0}
if success return json {dislike:NUM,email:"",like:NUM,name:"",organization:"", rate:NUM}
*/
router.post("/users/getUser", function(req, res) {
    try{
        var data = JSON.parse(req.body.data); 
        //safe:true , fsync: true
        if (data.email && data.email!="")
        MongoClient.connect(config.mongoUrl, {native_parser:true}, function(err, db) {
            var r={};
            if (err) {
                console.log("query error ",err);
                r.uid=0;
                r.status=0;
                r.desc="err db";
                res.send(lecturusCallback(JSON.stringify(r)))
                return;
            }
            var collection = db.collection('users');
            collection.find({email:data.email}).toArray(function (err, docs) {
                if (!docs.length){
                    r.uid=0;
                    r.status=0;
                    r.desc="uid not exist";
                    db.close();
                    res.send(lecturusCallback(JSON.stringify(r)))
                }
                else{
                    delete docs[0]._id
                    docs[0].user_id = true;
                    docs[0].camera_awake = true;
                    docs[0].system_language = true;
                    r.info = docs[0];
                    r.status=1;
                    r.desc="exist";
                    db.close();
                    res.send(lecturusCallback(JSON.stringify(r)))
                 }
            });
        });
        else{
            r.status=0;
            r.desc="uid error";
            res.send(lecturusCallback(JSON.stringify(r)));     
        }
    }catch(err){
        r.status=0;
        r.desc="data error";
        res.send(lecturusCallback(JSON.stringify(r)));
    }
    
});

/*
GET getUser by id recieve {id:email} 
if fail return {status:0}
if success return json {dislike:NUM,email:"",like:NUM,name:"",organization:"", rate:NUM}

router.get("/users/getUser/:id?", function(req, res) { // :id?/:something?
    var data = req.query.id;
    pool.getConnection(function (err, connection) {
    	if(err) { console.log(err); return; }
    	connection.query('select * from `'+config.database+'`.`user` where email like ?', [data], function (err, result){
	    	var r={};
	    	if (err != null) {
	    		console.log("query getUser (get) error "+err);
	    		r.status=0;
	    		res.send(lecturusCallback(JSON.stringify(r)))
	    	}
	    	else if (err == null) {
	    		console.log("query getUser (get) done");
	    		res.send(lecturusCallback(JSON.stringify(result)))
	    	}
    	});
    	connection.end();
    });
});
*/

/*
GET updateUser by id recieve data:{email:email} and combines with the params {dislike:NUM,like:NUM,name:"",organization:"", rate:NUM}
fail return {status:0}
success return {status:1}
*/
/*router.post("/users/updateUser", function(req, res) {
    var data;
    try{
    	data = JSON.parse(req.body.data);
    }catch(err){
    	data={}
    }
    console.log(data)
    pool.getConnection(function (err, connection) {
    	if(err) { console.log(err); return; }
    	connection.query('UPDATE `'+config.database+'`.`user` SET ? WHERE email = ?', [data,data.email], function (err, result){
	    	var r={};
	    	if (err != null) {
	    		console.log("query updateUser error "+err);
	    		r.status=0;
	    		res.send(lecturusCallback(JSON.stringify(r)))
	    	}
	    	else if (err == null) {
	    		console.log("query updateUser done");
	    		r.status=1;
	    		res.send(lecturusCallback(JSON.stringify(r)))
	    	}
    	});
    	connection.end();
    });
*/
function lecturusCallback (obj){
	//return 'lecturusCallback('+obj+');';
	return obj;
}

// static functions 
router.get("/users/getCourses:email?", function(req, res) {
    try{
        var data={};
        data.email = req.query.email;
        var r ={
            status:1,
            courses:JSON.stringify(fs.readFileSync('./views/json/courses.json', 'utf8'))
        }
       res.send(lecturusCallback(JSON.stringify(r)))
    }catch(err){
    	var r ={
            status:0,
            desc:"data error"            
        }
       res.send(lecturusCallback(JSON.stringify(r)))
    }
    
});

router.get("/users/getCourseVideos/:email?:courseName?", function(req, res) {
    try{
        var data={};
        data.email = req.query.email;
        data.courseName = req.query.courseName;
        var r ={
        status:1,
        videos:{
                title:"אוטומטים ושפות ופרמאליות",
                owner:"avishay",
                participants:["ofir","vidran"],
                length:15895,
                id:"temp"
            }
        }
       res.send(lecturusCallback(JSON.stringify(r)))
    }catch(err){
        var r ={
        status:0,
        desc:"data error"
        }
       res.send(lecturusCallback(JSON.stringify(r)))
    }
    
});
module.exports = router;
