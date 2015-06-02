// var express = require('express');
var fs = require("fs-extra");
// var router = express.Router();
var gcm = require('node-gcm');
//var gcm = require('gcm').GCM;

/* /auxiliary/getCourses -- precondition
 * data with email
 *
 * /auxiliary/getCourses -- postcondition
 * return all related courses to user
 * json data with status 1/0, all user courses hierarchy
*/
exports.getCourses= function(req, res, next){
    try{
        // try to get data
        var email = req.body.email;    

        // check if email field exist and no empty
        if (email && email!="")
        // try to connect to mongodb
    MongoClient.connect(config.mongoUrl, {native_parser:true}, function(err, db) {
        var r={};
            // if the connection failed return message and exit
            if (err) {
                console.log("query error ",err);
                r.uid=0;
                r.status=0;
                r.desc="err db";
                res.send((JSON.stringify(r)))
                return;
            }
            // ask for users collection
            var collection = db.collection('users');
            // try to find user id 
            collection.find({email:email}).toArray(function (err, docs) {
                // if the user not exist
                if (!docs.length) {
                    r.uid=0;
                    r.status=0;
                    r.desc="uid not exist";
                    db.close();
                    res.send((JSON.stringify(r)))
                }
                // if the user exist return organization courses
                else {
                    delete docs[0]._id
                    var org = docs[0].org;
                    r ={
                        status:1,
                        degrees: (fs.existsSync('./courses/'+org+'.json'))?JSON.parse(fs.readFileSync('./courses/'+org+'.json', 'utf8')):[]
                    }
                    db.close();
                    res.send((JSON.stringify(r)))
                }
            });
        });
        // if data.email not exist or empty
        else{
            r.status=0;
            r.desc="uid error";
            res.send((JSON.stringify(r)));     
        }
    // if the parsing failed
    }catch(err){
        var r={};
        r.status=0;
        r.desc="data error "+err;
        res.send((JSON.stringify(r)));
    }   
}
//   router.post("/auxiliary/getCourses", function(req, res) {
     
// });

/* 
 
*/
exports.getCoursesByOrg= function(req, res, next){
    try{
        // try to get data
        var org = req.body.org;    

        // check if email field exist and no empty
        if (org && org!="")
        // try to connect to mongodb
    MongoClient.connect(config.mongoUrl, {native_parser:true}, function(err, db) {
        var r={};
            // if the connection failed return message and exit
            if (err) {
                console.log("query error ",err);
                r.uid=0;
                r.status=0;
                r.desc="err db";
                res.send((JSON.stringify(r)))
                return;
            }
            // ask for users collection
            var collection = db.collection('academic_degrees');
            // try to find user id 
            collection.find({org:org}, {_id:false, academicId:false, org: false}).toArray(function (err, docs) {
                // if the user not exist
                if (!docs.length) {
                    r.status=0;
                    r.desc="org not exist";
                    db.close();
                    res.send((JSON.stringify(r)))
                }
                // if the user exist return organization courses
                else {
                    r ={
                        status:1,
                        check: docs[0].check,
                        degrees: docs[0][org]
                    }
                    db.close();
                    res.send((JSON.stringify(r)))
                }
            });
        });
        // if data.email not exist or empty
        else{
            r.status=0;
            r.desc="org error";
            res.send((JSON.stringify(r)));     
        }
    // if the parsing failed
    }catch(err){
        var r={};
        r.status=0;
        r.desc="data error "+err;
        res.send((JSON.stringify(r)));
    }    
}
// router.post("/auxiliary/getCoursesByOrg", function(req, res) {
    
// });

/* 

*/
exports.checkCoursesChanges= function(req, res, next){
   try{
        // try to get data
        var data = req.body;    
        
        // check if email field exist and no empty
        if (data && data!="" )
        // try to connect to mongodb
    MongoClient.connect(config.mongoUrl, {native_parser:true}, function(err, db) {
        var r={};
            // if the connection failed return message and exit
            if (err) {
                console.log("query error ",err);
                r.uid=0;
                r.status=0;
                r.desc="err db";
                res.send((JSON.stringify(r)))
                return;
            }
            // ask for users collection
            var collection = db.collection('academic_degrees');
            // try to find user id 
            collection.find({org:data.org}, {_id:false, academicId:false, org: false}).toArray(function (err, docs) {
                // if the user not exist
                if (!docs.length) {
                    r.status=0;
                    r.desc="org not exist";
                    db.close();
                    res.send((JSON.stringify(r)))
                }
                // if the user exist return organization courses
                else {
                    data.check = data.check || 0;
                    if (docs[0].check == data.check)
                        r ={
                            status:2,
                            desc:'no courses changes'
                        //info: docs[0]
                        //degrees: (fs.existsSync('./courses/'+org+'.json'))?JSON.parse(fs.readFileSync('./courses/'+org+'.json', 'utf8')):[]
                    }
                    else 
                        r ={
                            status:1,
                            check: docs[0].check,
                            degrees: docs[0][data.org]  
                        }
                        db.close();
                        res.send((JSON.stringify(r)))
                    }
                });
        });
        // if data.email not exist or empty
        else{
            r.status=0;
            r.desc="org error";
            res.send((JSON.stringify(r)));     
        }
    // if the parsing failed
    }catch(err){
        var r={};
        r.status=0;
        r.desc="data error "+err;
        res.send((JSON.stringify(r)));
    }   
}
// router.post("/auxiliary/checkCoursesChanges", function(req, res) {
      
// });

/* /auxiliary/getSessionsByCourse -- precondition
  data with email, degree (id), course (id)

   /auxiliary/getSessionsByCourse -- postcondition
    return all related videos by combination between user email degree and course
    json data with status 1/0, all related videos
*/
exports.getSessionsByCourse= function(req, res, next){
    var r ={};
    var data={};
    try
    {
        data.email = req.query.email;
        data.degreeId = parseInt(req.query.degree)||0;
        data.courseId = parseInt(req.query.course)||0;
        data.from = parseInt(req.query.from) || 0;
        data.to = parseInt(req.query.to) || 24;
    }catch(err){
        var r ={
            status:0,
            desc:"data error"
        }
        res.json(r);
        return;
    }
      if ( !data || !data.email || data.email == '' )  // if data.name property exists in the request is not empty
    {
        r.status = 0;   
        r.desc = "request must contain a property email or its empty";
        res.json(r); 
        return;
    }


    var query = db.model('sessions').find({$and:[{ degreeId : data.degreeId|| {$exists:true}},
    {courseId : data.courseId || {$exists:true} }, {stopTime:{ $gt: 0  }} ] },
    sessionPreview);
    query.count(function(err, count) {
        query.sort({timestamp:-1}).skip(data.from).limit(data.to-data.from).exec('find', function(err, docs)
        {    
            // failure while connecting to sessions collection
            if (err) 
            {
                console.log("failure while trying get videos, the error: ", err);
                r.status = 0;
                r.desc = "failure while trying get videos.";
                res.send((JSON.stringify(r)));
                return;
            }
            
            else if (docs)
            {
                createUsersJson(docs, function(result)
                {           
                    r.users = result;
                    r.status = 1;
                    r.length=docs.length;
                    r.count = count;
                    r.res = docs;
                    r.desc = "get videos.";
                    res.json(r); 
                    return;
                });
            }
        });         
    });
}
// router.get("/auxiliary/getSessionsByCourse/:email?:degree?:course?:from?:to?", function(req, res) {   
         
// });

/* /auxiliary/searchSessions -- precondition
   This function will receive data with name and org

    /auxiliary/searchSessions -- postcondition
    return all related videos by the query
    json data with status 1/0, length, res (for the results)

    /auxiliary/searchSessions -- description
    find sessions by searching into title, description, degree and course

    /auxiliary/searchSessions -- example
    name some_name
    org shenkar
*/
exports.searchSessions= function(req, res, next){
    var r ={};
    var data={};
    try
    {
        data = req.body;
        data.from = parseInt(req.body.from) || 0;
        data.to = parseInt(req.body.to) || 24;
    }catch(err){
        var r ={
            status:0,
            desc:"data error"
        }
        res.json(r);
        return;
    }
      if ( !data || data.name == '' )  // if data.name property exists in the request is not empty
    {
        r.status = 0;   
        r.desc = "request must contain a property name or its empty";
        res.json(r); 
        return;
    }

    var query = db.model('sessions').find({$and:[{org:data.org}, {stopTime:{ $gt: 0  }} ,
    {$or:[{ title:{$regex : ".*"+data.name+".*"}},{ description:{$regex : ".*"+data.name+".*"}},
    { degree:{$regex : ".*"+data.name+".*"}},{ course:{$regex : ".*"+data.name+".*"}}, ]} ]  },sessionPreview);
    query.count(function(err, count) {
        query.sort({timestamp:-1}).skip(data.from).limit(data.to-data.from).exec('find', function(err, docs)
        {    
            // failure while connecting to sessions collection
            if (err) 
            {
                console.log("failure while trying get videos, the error: ", err);
                r.status = 0;
                r.desc = "failure while trying get videos.";
                res.send((JSON.stringify(r)));
                return;
            }
            
            else if (docs.length)
            {
                createUsersJson(docs, function(result)
                {           
                    r.users = result;
                    r.status = 1;
                    r.count = count;
                    r.length=docs.length;
                    r.res = docs;
                    r.desc = "get videos.";
                    res.json(r); 
                    return;
                });
                                         
            }
            else
            {
                r.status = 1;
                r.count = 0;
                r.length=0;
                r.res = docs;
                r.desc = "get videos empty.";
                res.json(r); 
                return;
            }
        });         
    });
}
// router.post("/auxiliary/searchSessions", function(req, res) {
        
// });

/* /auxiliary/getTopRated -- precondition
   This function will receive data with org

    /auxiliary/getTopRated -- postcondition
    return all related videos in ordr by views
    json data with status 1/0, length, res (for the results)
*/
exports.getTopRated= function(req, res, next){
  var r ={};
    var data={};
    try
    {
        data = req.body;
        data.from = parseInt(req.body.from) || 0;
        data.to = parseInt(req.body.to) || 24;
    }catch(err){
        var r ={
            status:0,
            desc:"data error"
        }
        res.json(r);
        return;
    }
      if ( !data || data.org == '' )  // if data.org property exists in the request is not empty
    {
        r.status = 0;   
        r.desc = "request must contain a property name or its empty";
        res.json(r); 
        return;
    }

    console.log("looking for videos: "+data.org);
    db.model('sessions').find({$and:[{org:data.org},{stopTime:{$gt:0}}]}, sessionPreview).sort({views: -1}).skip(data.from).limit(data.to-data.from)
    .exec(function(err, docs)
    { 
        // failure while connecting to sessions collection
        if (err) 
        {
            console.log("failure while trying get videos, the error: ", err);
            r.status = 0;
            r.desc = "failure while trying get videos.";
            res.json(r);
            return;
        }
        
        else if (docs)
        {
            createUsersJson(docs, function(result)
            {           
                r.users = result;
                r.status = 1;
                r.length=docs.length;
                r.res = docs;
                r.desc = "get videos.";
                res.json(r); 
                return;
            });
                                       
        }
    });   
}
// router.post("/auxiliary/getTopRated", function(req, res) {
            
// });


/* /auxiliary/followedUsers -- precondition
   This function will receive data with email

    /auxiliary/followedUsers -- postcondition
    return all related videos user follow list
    json data with status 1/0, length, res (for the results)

    /auxiliary/followedUsers -- description
    This function will return all user favorites ordered by last update.

    /auxiliary/followedUsers -- example
    email: vandervidi@gmail.com
    from: 0
    to: 4
*/
exports.followedUsers= function(req, res, next){
    var r ={};
    var data={};
    try
    {
        data = req.body;
        data.from = parseInt(req.body.from) || 0;
        data.to = parseInt(req.body.to) || 4;
    }catch(err){
        var r ={
            status:0,
            desc:"data error"
        }
        res.json(r);
        return;
    }
      if ( !data || !data.email )  // if data.name property exists in the request is not empty
    {
        r.status = 0;   
        r.desc = "request must contain a property email or its empty";
        res.json(r); 
        return;
    }


    db.model('users').findOne({email:data.email}, {follow:true,org:true,_id:false})
    .lean().exec(function( err, docs )
    { 
        // failure while connecting to sessions collection
        if (err) 
        {
            console.log("failure while trying get videos, the error: ", err);
            r.status = 0;
            r.desc = "failure while trying get videos.";
            res.json(r);
            return;
        }
        
        else if (docs)
        {
            var arr = docs.follow.splice(data.from,(data.to-data.from));
            console.log("followed user to find",arr)
            var query = db.model('sessions').find({$and:[{ owner : {$in:arr}},{stopTime:{$gt:0}}]}, sessionPreview);
            query.sort({owner:1,stopTime: -1})//.skip(data.from).limit(data.to)
            .exec(function(err, docs){
                if (err) 
                {
                    console.log("failure while trying get videos, the error: ", err);
                    r.status = 0;
                    r.desc = "failure while trying get videos.";
                    res.json(r);
                    return;
                }
                else if (docs)
                {
                    createUsersJson(docs, function(result)
                    {   
                        temp = createKeyValJSON(docs,'owner');
                        r.users = result;
                        r.status = 1;
                        r.length=docs.length;
                        r.res = temp;
                        r.desc = "get videos.";
                        res.json(r); 
                        return;
                    });
                    
                    // console.log("followed videos found for "+data.email);
                    // r.status = 1;
                    // r.length=docs.length;
                    // r.res = docs;
                    // r.desc = "get videos.";
                    // res.json(r); 
                    // return; 

                }
            });
        }
    }); 
}
// router.post("/auxiliary/followedUsers", function(req, res) {
            
// });

/* /auxiliary/getUserSessions -- precondition
   This function will receive data with userId

    /auxiliary/getUserSessions -- postcondition
    return all related videos for specific user
    json data with status 1/0, length, res (for the results)

    /auxiliary/getUserSessions -- description
    This function will return all user sessions.

    /auxiliary/getUserSessions -- example
    userId: vandervidi@gmail.com
    from: 0
    to: 4
*/
exports.getUserSessions= function(req, res, next){
    var r ={};
    var data={};
    try
    {
        data = req.body;
        data.from = req.body.from || 0;
        data.to = req.body.to || 4;
    }catch(err){
        var r ={
            status:0,
            desc:"data error"
        }
        res.json(r);
        return;
    }
      if ( !data || !data.userId )  // if data.name property exists in the request is not empty
    {
        r.status = 0;   
        r.desc = "request must contain a property userId or its empty";
        res.json(r); 
        return;
    }


    db.model('users').findOne({email:data.userId}, {org:true,_id:false},
    function(err, docs)
    { 
        // failure while connecting to sessions collection
        if (err) 
        {
            console.log("failure while trying get videos, the error: ", err);
            r.status = 0;
            r.desc = "failure while trying get videos.";
            res.json(r);
            return;
        }
        
        else if (docs)
        {

            var query = db.model('sessions').find({$and:[{$or:[{owner:data.userId},{participants: data.userId }]},{org:docs.org},{stopTime:{$gt:0}}]}, sessionPreview);
            query.sort({views: -1}).skip(data.from).limit(data.to-data.from)
            .exec(function(err, docs){
                if (err) 
                {
                    console.log("failure while trying get videos, the error: ", err);
                    r.status = 0;
                    r.desc = "failure while trying get videos.";
                    res.json(r);
                    return;
                }
                else if (docs)
                {   
                    createUsersJson(docs, function(result)
                    {           
                        r.users = result;
                        r.status = 1;
                        r.length=docs.length;
                        r.res = docs;
                        r.desc = "get videos.";
                        res.json(r); 
                        return;
                    });
                    /*console.log("all videos found for "+data.userId);
                    r.status = 1;
                    r.length=result.length;
                    r.res = result;
                    r.desc = "get user videos.";
                    res.json(r); 
                    return;   */                      
                }
            });
        }
    }); 
}
// router.post("/auxiliary/getUserSessions", function(req, res) {
            
// });

/*  
    auxiliary/getUserFavorites -- precondition
    This function will receive data with userId

    /auxiliary/getUserFavorites -- postcondition
    return all related videos user favorite list
    json data with status 1/0, length, res (for the results)

    /auxiliary/getUserFavorites -- description
    This function will return all user favorites ordered by last update.
  
    /auxiliary/getUserFavorites -- example
    userId           avishayhajbi@gmail.com
*/
exports.getUserFavorites= function(req, res, next){
    var r ={};
    var data={};
    try
    {
        data = req.body;
        data.from = parseInt(req.body.from) || 0;
        data.to = parseInt(req.body.to) || 4;
    }catch(err){
        var r ={
            status:0,
            desc:"data error"
        }
        res.json(r);
        return;
    }
      if ( !data || !data.userId || data.userId == '' )  // if data.name property exists in the request is not empty
    {
        r.status = 0;   
        r.desc = "request must contain a userId name or its empty";
        res.json(r); 
        return;
    }

    db.model('users').findOne({email:data.userId}, {favorites:true, org:true,_id:false},
    function(err, docs)
    { 
        // failure while connecting to sessions collection
        if (err) 
        {
            console.log("failure while trying get videos, the error: ", err);
            r.status = 0;
            r.desc = "failure while trying get videos.";
            res.json(r);
            return;
        }
        
        else if (docs)
        {
            if (docs.favorites.length)
            var arr = docs.favorites.splice(data.from,(data.to-data.from))
            db.model('sessions').find({$and:[{sessionId:{$in:arr}},{org:docs.org},{stopTime:{$gt:0}}]}, sessionPreview)//.sort({owner:1,views: -1})
            .skip(data.from).limit(data.to-data.from)
            .exec(function(err, docs)
            { 
                // failure while connecting to sessions collection
                if (err) 
                {
                    console.log("failure while trying get videos, the error: ", err);
                    r.status = 0;
                    r.desc = "failure while trying get videos.";
                    res.json(r);
                    return;
                }
                
                else if (docs)
                {
                    var temp = orderByArray(docs,arr);
                    createUsersJson(docs, function(result)
                    {           
                        r.users = result;
                        r.status = 1;
                        r.length=docs.length;
                        r.res = temp;
                        r.desc = "get videos.";
                        res.json(r); 
                        return;
                    });
                    /*
                    console.log("favorites videos found for "+ data.userId);
                    r.status = 1;
                    r.length=docs.length;
                    r.res = docs;
                    r.desc = "get videos.";
                    res.json(r); 
                    return;  */                       
                }
                
            });                        
        }
    }); 
}
// router.post("/auxiliary/getUserFavorites", function(req, res) {
            
// });


/* /auxiliary/addRemoveFavorites -- precondition
 *  This function will receive json with sessionId and userId.
 *
 * /auxiliary/addRemoveFavorites -- postcondition
 *  This function will return json with status: 1 = success / 0 = failure.
 *
 * /auxiliary/addRemoveFavorites -- description
 *  This function will user favorites .
 * 
 * /auxiliary/addRemoveFavorites -- example
 *  sessionId               142964947916810933728
 *  userId           avishayhajbi@gmail.com
 */
exports.addRemoveFavorites= function(req, res, next){
    var r = { };

   try
   {
    var sessionId = req.body.sessionId;
    var userId = req.body.userId;
  }
  catch( err )
  {
    console.log("UPDATEFAVIRTES: failure while parsing the request, the error:" + err);
    r.status = 0;
    r.desc = "failure while parsing the request";
    res.json(r);
    return;
  }

  if ( typeof sessionId === 'undefined' || sessionId == null || sessionId == "" ||
       typeof userId === 'undefined' || userId == null || userId == "" )        // if one the propertiey do not exists in the request and it is empty
  {
   console.log("UPDATEFAVIRTES:request must contain sessionId property.");
   r.status = 0;    
   r.desc = "request must contain sessionId and userId property.";
   res.json(r); 
   return;
 }
    db.model('users').findOne({email: userId} ,
    function (err, userResult)
    {
      // failure during user search
      if (err) 
      {
        console.log("failure during user search, the error: ", err);
        r.uid = 0;
        r.status = 0;
        r.desc = "failure during user search";
        res.json(r);    
        return;
      }
      else if (userResult.favorites.indexOf(sessionId) == -1)
      {
        userResult.favorites.unshift(sessionId);
        userResult.save(function(err, obj) 
        { 
          if (err)
          {
           console.log("UPDATEFAVIRTES:failure user save, the error: ", err);
           r.status = 0;
           r.desc = "failure UPDATEFAVIRTES save";
           res.json(r); 
           return;          
         }

         console.log("UPDATEFAVIRTES:session: " + userId + " favorites was updated.");
         r.status = 1;
         r.desc = "session: " + sessionId + " favirtes was updated";
         res.json(r);
         return;
      
       });
        
      }
      else
      {
       var index =  userResult.favorites.indexOf(sessionId);
       userResult.favorites.splice(index, 1);
       userResult.save(function(err, obj) 
         { 
          console.log("UPDATEFAVIRTES: save");
          if (err)
          {
           console.log("UPDATEFAVIRTES:failure user favorites save, the error: ", err);
           r.status = 0;
           r.desc = "failure user favorites save";
           res.json(r); 
           return;          
         }

         console.log("UPDATEFAVIRTES:user: " + userId + " update favorites was updated.");
         r.status = 1;
         r.desc = "user: " + userId + " update favorites was updated";
         res.json(r);
         return;
       });
     }
    });
 }
// router.post("/auxiliary/addRemoveFavorites", function(req, res ){
   
// });

/* 
    /auxiliary/lastViews -- precondition
    This function will receive data with userId

    /auxiliary/lastViews -- postcondition
    return all related videos user last views list
    json data with status 1/0, length, res (for the results)

    /auxiliary/favritesActions -- description
    This function will return all user last views ordered by last viewed .
  
    /auxiliary/favritesActions -- example
    userId           avishayhajbi@gmail.com
*/
exports.lastViews= function(req, res, next){
    var r ={};
    var data={};
    try
    {
        data = req.body;
        data.from = parseInt(req.body.from) || 0;
        data.to = parseInt(req.body.to) || 24;
    }catch(err){
        var r ={
            status:0,
            desc:"data error"
        }
        res.json(r);
        return;
    }
      if ( !data || !data.userId || data.userId == '' )  // if data.name property exists in the request is not empty
    {
        console.log('lastViews data',data)
        r.status = 0;   
        r.desc = "request must contain a property userId or its empty";
        res.json(r); 
        return;
    }

    db.model('users').findOne({email:data.userId}, {lastViews:true,org:true,_id:false},
    function(err, docs)
    { 
        // failure while connecting to sessions collection
        if (err) 
        {
            console.log("failure while trying get lastViews, the error: ", err);
            r.status = 0;
            r.desc = "failure while trying get lastViews.";
            res.json(r);
            return;
        }
        
        else if (docs)
        {
            var arr = docs.lastViews.splice(data.from,(data.to-data.from))
            console.log(arr.length)
            db.model('sessions').find({$and:[{sessionId:{$in:arr}},{org:docs.org},{stopTime:{$gt:0}}]}, sessionPreview)//.sort({owner:1,views: -1})
            //.skip(data.from).limit(data.to-data.from)
            .exec(function(err, docs)
            { 
                // failure while connecting to sessions collection
                if (err) 
                {
                    console.log("failure while trying get lastViews, the error: ", err);
                    r.status = 0;
                    r.desc = "failure while trying get lastViews.";
                    res.json(r);
                    return;
                }
                
                else if (docs)
                {
                    var temp = orderByArray(docs,arr);
                    //console.log("videos found "+ result);
                    createUsersJson(docs, function(result)
                    {           
                        r.users = result;
                        r.status = 1;
                        r.length=docs.length;
                        r.res = temp;
                        r.desc = "get videos.";
                        res.json(r); 
                        return;
                    });

                    /*
                    r.status = 1;
                    r.length=docs.length;
                    r.res = docs;
                    r.desc = "lastViews.";
                    res.json(r); 
                    return; */                        
                }
            });                        
        }
    }); 
}
// router.post("/auxiliary/lastViews", function(req, res) {
            
// });

function orderByArray(docs,arr){
    //console.log(arr)
    //console.log(docs)
    //var temp = [] ;
    for (var i = 0 ; i < arr.length ; i++){
       for (var j = i ; j < arr.length ; j++){
            if (docs[j].sessionId == arr[i]){
                var doc = docs[i];
                docs[i] = docs[j];
                docs[j]=doc;
                //temp.push(docs[i]);
                continue;
            }
        } 
    }
    //console.log(docs)
    return docs;
}

function createKeyValJSON  (arr , key){
    //arrayName.splice(0,half_length);
    var temp = {}, uid = '' ,count=0;
    for ( k in arr ){
        if (count==4 && uid == arr[k][key]) continue;
        if (uid != arr[k][key])
        {
            count = 0;
            uid = arr[k][key];
            temp[uid] = [];
        }
        count++;
        temp[uid].push(arr[k]);
    }
    return temp;
};

// module.exports = router;