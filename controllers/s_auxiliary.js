var fs = require("fs-extra");
var gcm = require('node-gcm');

/** @namespace auxiliary */

/**
 * @inner
 * @memberof auxiliary
 * @function getCoursesByOrg
 * @desc find the related courses to user by the organization
 * @param {json} data - The object with the data
 * @param {string} data.org - shenkar
 * @returns {json} status: 1/0 , degrees
 */
exports.getCoursesByOrg= function(req, res, next){
    var org, r={};
    try{
        // try to get data
        logger.debug(req.body)
        org = req.body.org;    
    }catch(err){
        r.status=0;
        r.desc="data error "+err;
        res.json(r);
        return;
    } 
        // check if org field exist and not empty
        if (org && org!="")
            db.model('academic_degrees').findOne({org:org}, {_id:false, academicId:false, org: false},
                function (err, doc) {
                if (err) {
                    r.status=0;
                    r.desc="org not exist";
                    res.json(r)
                    return;
                }
                // if the user exist return organization courses
                else if(doc){
                    logger.debug("doc exist")
                    r ={
                        status:1,
                        check: doc.check,
                        degrees: doc.degrees
                    }
                    res.json(r)
                    return;
                }
                else {
                    logger.debug("doc is not exist")
                    r ={
                        status:0,
                        desc: org+" is not found"
                    }
                    res.json(r)
                    return;
                }
            });
        else {
            r ={
                status:0,
                desc: "org is empty or not exist"
            }
            res.json(r)
            return;
        }
}

/**
 * @inner
 * @memberof auxiliary
 * @function checkCoursesChanges
 * @desc check if the version is changed 
 * @param {json} data - The object with the data
 * @param {string} data.org - shenkar
 * @param {number} data.check - {0-9}*
 * @returns {json} status: 1/0 , degrees
 */
exports.checkCoursesChanges= function(req, res, next){
    var r={};
    var data='';
   try{
        // try to get data
        data = req.body;    
     // if the parsing failed
    }catch(err){
        r.status=0;
        r.desc="data error "+err;
        res.json(r);
        return;
    }   
        // check if email field exist and no empty
    if (data && data!="" )
     db.model('academic_degrees').findOne({org:data.org}, {_id:false, academicId:false, org: false},
     function (err, doc) {
        if (err) {
            r.status=0;
            r.desc="err occured";
            res.json(r);
            return;
        }
        if (!doc) {
            r.status=0;
            r.desc="org not exist";
            res.json(r)
            return;
        }
        // if the user exist return organization courses
        else {
            data.check = data.check || 0;
            if (doc.check == data.check)
            {
                r ={
                    status:2,
                    desc:'no courses changes'
                }
            }
            else {
                r ={
                    status:1,
                    check: doc.check,
                    degrees: doc.degrees 
                }
            }
            res.json(r);
            return;
        }
        });
        else{
            r.status=0;
            r.desc="org is empty or not exist";
            res.json(r);   
            return;  
        }
}

/**
 * @inner
 * @memberof auxiliary
 * @function getSessionsByCourse
 * @desc find related videos by combination between user email degree and course
 * @param {json} data - The object with the data
 * @param {string} data.email - name@gmail.com
 * @param {number} data.degree - {0-9}*
 * @param {number} data.course - {0-9}*
 * @param {number} data.from - {0-9}*
 * @param {number} data.to - {0-9}*
 * @returns {json} status: 1/0 , all related videos
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

/**
 * @inner
 * @memberof auxiliary
 * @function searchSessions
 * @desc find the related videos by the name and the org
 * @param {json} data - The object with the data
 * @param {string} data.name - text
 * @param {string} data.org - shenkar
 * @param {number} data.from - {0-9}*
 * @param {number} data.to - {0-9}*
 * @returns {json} status: 1/0, length, res (for the results)
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

/**
 * @inner
 * @memberof auxiliary
 * @function getTopRated
 * @desc find the related videos by views order
 * @param {json} data - The object with the data
 * @param {string} data.org - shenkar
 * @param {number} data.from - {0-9}*
 * @param {number} data.to - {0-9}*
 * @returns {json} status: 1/0, length, res (for the results)
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

/**
 * @inner
 * @memberof auxiliary
 * @function followedUsers
 * @desc find user follow list videos 
 * @param {json} data - The object with the data
 * @param {string} data.email - name@gmail.com
 * @param {number} data.from - {0-9}*
 * @param {number} data.to - {0-9}*
 * @returns {json} status: 1/0, length, res (for the results)
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

/**
 * @inner
 * @memberof auxiliary
 * @function getUserSessions
 * @desc find user sessions
 * @param {json} data - The object with the data
 * @param {string} data.userId - name@gmail.com
 * @param {number} data.from - {0-9}*
 * @param {number} data.to - {0-9}*
 * @returns {json} status: 1/0, length, res (for the results)
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

/**
 * @inner
 * @memberof auxiliary
 * @function getUserFavorites
 * @desc find user favorite list
 * @param {json} data - The object with the data
 * @param {string} data.userId - name@gmail.com
 * @param {number} data.from - {0-9}*
 * @param {number} data.to - {0-9}*
 * @returns {json} status: 1/0, length, res (for the results)
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

/**
 * @inner
 * @memberof auxiliary
 * @function addRemoveFavorites
 * @desc find user favorite list
 * @param {json} data - The object with the data
 * @param {string} data.userId - name@gmail.com
 * @param {string} data.sessionId - text
 * @returns {json} status: 1/0
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

/**
 * @inner
 * @memberof auxiliary
 * @function lastViews
 * @desc find user last views list
 * @param {json} data - The object with the data
 * @param {string} data.userId - name@gmail.com
 * @param {number} data.from - {0-9}*
 * @param {number} data.to - {0-9}*
 * @returns {json} status: 1/0, length, res (for the results)
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


orderByArray = function (docs,arr){
    for (var i = 0 ; i < arr.length ; i++){
       for (var j = i ; j < arr.length ; j++){
            if (docs[j].sessionId == arr[i]){
                var doc = docs[i];
                docs[i] = docs[j];
                docs[j]=doc;
                continue;
            }
        } 
    }
    return docs;
}

createKeyValJSON=function  (arr , key){
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
}
