var fs = require("fs-extra");
var multiparty = require('multiparty');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var formidable = require('formidable');
var cloudinary = require('cloudinary');
var ffmpeg = require('fluent-ffmpeg');
var ffmpegCommand = ffmpeg();
var gcm = require('node-gcm');

/** @namespace session */

/**
 * @inner
 * @memberof session
 * @function updateSession
 * @desc update the session in mongo collection 
 * @param {json} data - The object with the data
 * @returns {json} status: 1/0
 */

exports.updateSession=function (req,res,next){
  var data = req.body;
   console.log("data.sessionId ",data.sessionId)

  MongoClient.connect(config.mongoUrl, { native_parser:true }, function(err, db) // TODO. REMOVE *
  {
    console.log("Trying to connect to the db.");
    var r ={};              
      // if connection failed
      if (err) 
      {
        console.log("MongoLab connection error: ", err);
        r.uid = 0;
        r.status = 0;
        r.desc = "failed to connect to MongoLab.";
        res.send((JSON.stringify(r)));
        return;
      }
      //console.log(JSON.stringify(sessionId))
      // get sessions collection 
      var collection = db.collection('sessions');
      //TODO. check that 'recordStarts' value differs from expected, else return status '0' - failure.                    
      collection.find( {$and:[{ sessionId:data.sessionId },{owner : data.owner}] }).toArray(function (err, docs)
      { 
          // failure while connecting to sessions collection
          if (err) 
          {
            console.log("failure while trying close session, the error: ", err);
            r.status = 0;
            r.desc = "failure while trying update session.";
            res.send((JSON.stringify(r)));
            return;
          }
          
          else if (docs.length)
          {
            collection.update({sessionId:data.sessionId},{ $set : data }, {upsert:false ,safe:true , fsync: true}, 
              function(err, result) { 
                if (err)
                {
                  console.log("session not updated "+err);
                  r.status=0;
                  r.desc="session not updated";
                    db.close(); // TODO REMOVE 
                    res.send((JSON.stringify(r)))
                    return;
                  } 
                  else 
                  {
                    console.log("session updated");
                    r.status=1;
                    r.desc="session updated";
                    db.close(); // TODO REMOVE 
                    res.send((JSON.stringify(r)));
                    return;
                  }
                });
          }
          else
          {
           console.log("session not found or you are not the owner");
           r.status=0;
           r.desc="not found or you are not the owner";
           db.close(); // TODO REMOVE 
           res.send((JSON.stringify(r)))
         }
       });         
  });
}


/**
 * @inner
 * @memberof session
 * @function updateSessionRating
 * @desc This function will find the needed session and check if the user participates in it.
 *  It will update the rating and the voters list according to the rating property, received in the request.
 *  If the user already voted oposite to his current vote, the function will remove him from the oposite list and reduce the oposite rating by 1.
 *  If his has voted similarmy to his current vote, nothing will be changed in the rating.
 * @param {json} data - The object with the data
 * @param {string} data.email - name@gmail.com
 * @param {string} data.sessionId - text
 * @param {string} data.rating - 0/1 decrease/increase
 * @returns {json} status: 1/0, 
 * res: json with positive and negative each one of them has users:true/false value:number
 */

exports.updateSessionRating=function (req,res,next){
  var r = { };
    var votedBefore = -1;

    try
    {
     var sessionId = req.body.sessionId;
     var rating = req.body.rating;
     var email = req.body.email;
   }  
   catch( err )
   {
     console.log("UPDATESESSIONRATING: failure while parsing the request, the error:" + err);
     r.status = 0;
     r.desc = "failure while parsing the request";
     res.json(r);
     return;
   }

    //TODO. Remove
    console.log("session id: " + sessionId);
    console.log("user email: " + email);
    console.log("session rating: " + rating);
    
    if (    typeof sessionId === 'undefined' || sessionId == null || sessionId == "" ||
     typeof rating === 'undefined' || rating == null || rating == "" ||   
      typeof email === 'undefined' || email == null || email == ""  )   // if one of the properties do not exists in the request or it is empty
    {
      console.log("UPDATESESSIONRATING:request must contain sessionId, email and rating properties.");
      r.status = 0; 
     r.desc = "request must contain sessionId, email and rating properties.";
     res.json(r); 
     return;
   }

   db.model('sessions').findOne( {$and:[{ sessionId : sessionId }, { stopTime : { $gt : 0 }} ]},
    //{ participants : true, owner : true, _id : false }, - does not wotk with this
    function (err, result)
    {
     if (err) 
     {
       console.log("UPDATESESSIONRATING:failure during session search, the error: ", err);
       r.status = 0;
       r.desc = "failure during session search";
       res.json(r); 
       return;
     }
     if ( !result )
     {
       console.log("UPDATESESSIONRATING:session: " + sessionId + " was not found.");
       r.status = 0;
       r.desc = "session: " + sessionId + " was not found";
       res.json(r);
       return;
     }
     else
     {

        //check if this user woted before
        if ( result.rating.positive.users.indexOf(email) != -1)   //voted positive
        {
          votedBefore = 1;
        }
        if ( result.rating.negative.users.indexOf(email) != -1)   //voted negative
        {
          votedBefore = 0;
       }

      if (rating == 0)  //negative case
      {
        if ( votedBefore == 0 )       //voted negative before -  remove the user from negative voters list and update the rating value
        {
          //decrease the negative rating of the session by 1
          --result.rating.negative.value; 
          
          //remove from negative voters list
          result.rating.negative.users.splice(result.rating.negative.users.indexOf(email), 1); 
          
          console.log("UPDATESESSIONRATING:user: " + email + " DOWN vote for session: " + sessionId + " was successfully removed.");
          r.desc = "user: " + email + " DOWN vote for session: " + sessionId + " was successfully removed.";
        }
        else
        { 
                if ( votedBefore == 1 )     //voted positive before - remove the user from positive voters list and update the positive rating value 
                {
                  //decrease the positive rating of the session by 1
                  --result.rating.positive.value;

            //remove from positive voters list
            result.rating.positive.users.splice(result.rating.negative.users.indexOf(email), 1);            
          }
          
          //increase the negative rating of the session by 1
          ++result.rating.negative.value;
          
          //add to the negative votes list
          result.rating.negative.users.push(email);
          
          console.log("UPDATESESSIONRATING:user: " + email + " DOWN vote for session: " + sessionId + " was successfully received.");
          r.desc = "user: " + email + " DOWN vote for session: " + sessionId + " was successfully received.";
        }
      }

      if (rating == 1)  //positive case
      {
        if ( votedBefore == 1 )       //voted positive before - remove the user from positive voters list and update the positive rating value
        {
                //decrease the positive rating of the session by 1
               --result.rating.positive.value;

          //remove from positive voters list
          result.rating.positive.users.splice(result.rating.negative.users.indexOf(email), 1);
          
          console.log("UPDATESESSIONRATING:user: " + email + " UP vote for session: " + sessionId + " was successfully removed.");
          r.desc = "user: " + email + " UP vote for session: " + sessionId + " was successfully removed.";              
        }
        else 
        {
                if ( votedBefore == 0 )     //voted negative before -  remove the user from negative voters list and update the rating value
                {
            //decrease the negative rating of the session by 1
            --result.rating.negative.value; 
            
            //remove from negative voters list
            result.rating.negative.users.splice(result.rating.negative.users.indexOf(email), 1);            
         }

          //increase the positive rating of the session by 1
          ++result.rating.positive.value; 
          
          //add the user to the positive voters lists
          result.rating.positive.users.push(email);

          console.log("UPDATESESSIONRATING:user: " + email + " UP vote for session: " + sessionId + " was successfully received.");
          r.desc = "user: " + email + " UP vote for session: " + sessionId + " was successfully received."; 
        } 
      }

        //result.markModified('participants');
        result.save(function(err, obj) 
        { 
          if (err)
          {
           console.log("UPDATESESSIONRATING:failure session save, the error: ", err);
           r.status = 0;
           r.desc = "failure session save";
           res.json(r); 
           return;          
         }

        //obj.rating.positive.users =  (obj.rating.positive.users.indexOf(email)!= -1)?true:false;
        //obj.rating.negative.users =  (obj.rating.negative.users.indexOf(email)!= -1)?true:false; 

         r.status = 1;
         r.res = {
            positive:{
                users: (obj.rating.positive.users.indexOf(email) != -1) ? true : false,
                value:obj.rating.positive.value 
            },
            negative:{
                users: (obj.rating.negative.users.indexOf(email) != -1) ? true : false,
                value:obj.rating.negative.value 
            }
         };
         res.json(r);
         return; 
       });
      }    
    }); 
}

/**
 * @inner
 * @memberof session
 * @function joinSession
 * @desc This function will find the 'session' document in the 'sessions' collection by sessionId 
 * that will be received in the request. This function will insert the email of the user to 
 * 'participants' property in the 'session' document.
 * @param {json} data - The object with the data
 * @param {string} data.email - name@gmail.com
 * @param {string} data.sessionId - text
 * @returns {json} status: 1/0
 */

exports.joinSession=function (req,res,next){
  var r = { };  //response object 
  var allParticipants = new Array();

  try     //try to parse json data
  {
      var email = req.body.email;
      var sessionId = req.body.sessionId;
  }
  catch( err )
  {
      console.log("JOINSESSION: failure while parsing the request, the error:" + err);
      r.status = 0;
      r.desc = "failure while parsing the request";
      res.json(r);
      return;
  }
  
    if (  typeof email === 'undefined' || email == null || email == "" ||
        typeof sessionId === 'undefined' || sessionId == null || sessionId == ""  ) // if email and sessionId properties do not exist in the request and empty
    {
      console.log("JOINSESSION: request must contain a property email, sessionId.");
      r.status = 0; 
        r.desc = "request must contain a property email, sessionId.";
        res.json(r); 
        return;
    }
    
    console.log("JOINSESSION:email: " + email + ", sessionId: " + sessionId);
    
    db.model('sessions').findOne( { sessionId : sessionId },
    //{ participants : true, owner : true, _id : false }, - does not wotk with this
    function (err, result)
    {
        if (err) 
      {
        console.log("JOINSESSION:failure during session search, the error: ", err);
      r.status = 0;
      r.desc = "failure during session search";
        res.json(r);  
        return;
      }
        if ( !result )
        {
          console.log("JOINSESSION:session: " + sessionId + " was not found");
          r.status = 0;
          r.desc = "session: " + sessionId + " was not found";
          res.json(r);
          return;
      }
      else
      {
        //TODO. REMOVE. validation for Rami...
        if ( result.participants.indexOf(email) == -1 ) 
        { 
          console.log("JOINSESSION:participant");
        }
        if ( result.owner != email ) 
        { 
          console.log("JOINSESSION:owner");
        }
        
          if (result.participants.indexOf(email) == -1 && result.owner != email )
          {
            result.participants.push(email);
            //result.markModified('participants');
            result.save(function(err, obj) 
            { 
              if (err)
              {
                    console.log("JOINSESSION:failure session save, the error: ", err);
                    r.status = 0;
                    r.desc = "failure session save";
                    res.json(r);  
                    return;           
                }

              //console.log("obj is: " + obj); object after the update
                  console.log("JOINSESSION:user: " + email + " was joined to the session.");
                  r.status = 1;
                  r.desc = "user: " + email + " was joined to the session.";
                  res.json(r);
                  return; 
              });
          }
          else
          {
              console.log("JOINSESSION:user: " + email + " already exists in the session");
              r.status = 1;
              r.desc = "user: " + email + " already exists in the session";
              res.json(r);
              return;
          }
          //console.log("JOINSESSION:result: " + result);
        }
      });
}


/**
 * @inner
 * @memberof session
 * @function joinSession
 * @desc remove the image from the cloud
 * @param {json} data - The object with the data
 * @param {string} data.imageurl - http://
 * @param {string} data.sessionId - text
 * @returns {json} status: 1/0
 */

exports.deleteImage=function (req,res,next){
  var imageUrl;
    var r = { };
    
    try
    {
      imageUrl = req.body.imageurl; //TODO. should be imageUrl = camel case
    }
    catch( err )
    {
      console.log("DELETEIMAGE:failure while parsing the request, the error:" + err);
      r.status = 0;
      r.desc = "failure while parsing the request.";
      res.json(r);
      return;
    }
    
    if ( !imageUrl || imageUrl == '' ) 
    {
      console.log("DELETEIMAGE:request must contain an image URL.");
      r.status = 0;
      r.desc = "request must contain an image URL.";
      res.json(r);
      return;
    }
     var temp = imageUrl.split('/');

    cloudinary.api.delete_resources([temp[temp.length-1].split(".")[0]],

    function(result){
      console.log("DELETEIMAGE:result is: " + result);
      if (result.result == "not found")
      {
        console.log("DELETEIMAGE:image was not found.");
        r.status = 0;
        r.desc = "image was not found.";
        res.json(r);
        return;
      }
      
      console.log("DELETEIMAGE:image was deleted.");
      r.status = 1;
      r.desc = "image was deleted.";
      res.json(r);
      return;
    });

}

/**
 * @todo find another solution
 * @inner
 * @memberof session
 * @function rotateImage
 * @desc remove the image from the cloud
 * @param {json} data - The object with the data
 * @param {string} data.imageurl - http://
 * @param {string} data.sessionId - text
 * @param {number} data.angle - {0-9}*
 * @returns {json} status: 1/0
 */

exports.rotateImage=function (req,res,next){
  var imageUrl, angle, sessionId;
    var r = { };
    
    try
    {
      imageUrl = req.body.imageurl; //TODO. should be imageUrl = camel case
      angle = req.body.angle||'exif';
      sessionId = req.body.sessionId;
    }
    catch( err )
    {
      console.log("rotateImage:failure while parsing the request, the error:" + err);
      r.status = 0;
      r.desc = "failure while parsing the request.";
      res.json(r);
      return;
    }
    
    if ( !sessionId || sessionId == '' || !imageUrl || imageUrl == '' ) 
    {
      console.log("rotateImage:request must contain an image URL.");
      r.status = 0;
      r.desc = "request must contain an image URL.";
      res.json(r);
      return;
    }
     var temp = imageUrl.split('/');
     var imageid = temp[temp.length-1].split(".")[0];

     cloudinary.uploader.upload(imageUrl,
    function(result){
      //console.log("rotateImage:result is: " , result);
      if (result.result == "not found" || result.error)
      {
        console.log("rotateImage:image was not found or error occured.");
        r.status = 0;
        r.desc = "image was not found or error occured.";
        res.json(r);
        return;
      }
      
      console.log("rotateImage:image was rotated.");
      r.status = 1;
      r.desc = "image was rotated.";
      res.json(r);
      return;
    },
    {
      public_id: imageid, 
      crop: 'limit',
      width: 640,
      height: 360,
      angle: angle,                                   
      tags: [sessionId,'lecturus']
    });
}

/**
 * @inner
 * @memberof session
 * @function deleteSession
 * @desc delete the session with his data
 * @param {json} data - The object with the data
 * @param {string} data.userId - name@gmail.com
 * @param {string} data.sessionId - text
 * @returns {json} status: 1/0
 */

exports.deleteSession=function (req,res,next){
  var sessionId, email;
    var r = {};
    
    try
    {
      sessionId = req.body.sessionId;
      email = req.body.userId;
    }
    catch(err)
    {
    console.log("DELETESESSION:failure while parsing the request, the error:", err);
    r.status = 0;
    r.desc = "failure while parsing the request";
    res.json(r);
    return;     
    }
    
    if (  typeof sessionId === 'undefined' || sessionId == null || sessionId == "" ||
        typeof email === 'undefined' || email == null || email == "" ) 
    {
      console.log("DELETESESSION:request must contain sessionId and owner properties.");
      r.status = 0;
      r.desc = "request must contain sessionId and owner properties.";
      res.json(r);
      return;
    }

  db.model('sessions').findOne(
  { sessionId : sessionId }, 
    function(err, sessionObj)
    {    
      console.log(sessionObj)
        // failure while connecting to sessions collection
        if (err) 
        {
            console.log("DELETESESSION:failure during session search, the error: ", err);
            r.status = 0;
            r.desc = "failure during session search.";
            res.json(r);
            return;
        }
        
    // if the session do not exist
        if (sessionObj == null)
        {
          console.log("DELETESESSION:session: " + sessionId + " was not found.");
            r.status = 0;
            r.desc = "session: " + sessionId + " was not found.";
          res.json(r);  
            return;
        }
        
        if (sessionObj.owner != email)
        {
          console.log("DELETESESSION:email: " + email + " do not belong to session owner. "+sessionObj.owner);
            r.status = 0;
            r.desc = "email: " + email + " do not belong to session owner.";
          res.json(r);  
            return;
        }
        else
        {
            cloudinary.api.delete_resources_by_tag(sessionId,
            function(result)
            { 
              console.log("DELETESESSION:result is: " + result);
            
              if (result.result == "not found")
              {
                  console.log("DELETESESSION:session was not found in the cloud.");
                  r.status = 0;
                r.desc = "session was not found in the cloud.";
                  res.json(r);
                  return;
              }
              
              sessionObj.remove(function (err){
                if (err)
                {
                  console.log("DELETESESSION:session could not be deleted from the cloud.");
                  r.status = 0;
                  r.desc = "session could not be was deleted from the cloud.";
                  res.json(r);
                  return;
                }
                console.log("DELETESESSION:session was deleted from the cloud.");
                r.status = 1;
                r.desc = "session was deleted from the cloud.";
                res.json(r);
                return;
              });
              
            },
            { resource_type: 'raw' });
        }
  });
}


/**
 * @inner
 * @memberof session
 * @function deleteSession
 * @desc This function will switch between current owner and new owner, send a gcm message to 
 * the new owner so the application will start the recording on at his mobile device. 
 * In addition, the function will send a gcm message to the old session owner so the application 
 * will stop the recording at his mobile device.
 * @param {json} data - The object with the data
 * @param {string} data.currOwner - name@gmail.com
 * @param {string} data.futureOwner - name@gmail.com
 * @param {string} data.sessionId - text
 * @returns {json} status: 1/0
 */
exports.switchSessionOwner=function (req,res,next){
  var sessionId, currOwner, futureOwner;
  var r = { };
  var message = new gcm.Message();  //create new gcm message
  var sender = new gcm.Sender('AIzaSyAjgyOeoxz6TC8vXLydERm47ZSIy6tO_6I'); //create new gcm object
  var users = new Array();
  
    try
    {
      sessionId = req.body.sessionId;
      currOwner = req.body.currOwner;
      futureOwner = req.body.futureOwner;
    }
    catch( err )
    {
      console.log("SWITCHSESSIONOWNER:failure while parsing the request, the error:" + err);
      r.status = 0;
      r.desc = "failure while parsing the request.";
      res.json(r);
      return;
    }
    
    if (  typeof sessionId === 'undefined' || sessionId == null || sessionId == "" ||
        typeof currOwner === 'undefined' || currOwner == null || currOwner == "" ||
        typeof futureOwner === 'undefined' || futureOwner == null || futureOwner == "" )  //check if sessionId, currOwner and futureOwner properties exist in the request and not empty
    {
      console.log("SWITCHSESSIONOWNER:request must contain sessionId, currOwner and futureOwner properties.");
      r.status = 0; 
        r.desc = "request must contain sessionId, currOwner and futureOwner properties.";
        res.json(r); 
        return;
    } 
    
    db.model('sessions').findOne( { sessionId : sessionId },
  //{ _id : false },
    function( err, sessionObj )
    {
      console.log("SWITCHSESSIONOWNER:session is: " + sessionObj);
      
      // failure during session search
        if (err) 
        {
          console.log("SWITCHSESSIONOWNER:failure during session search, the error: ", err);
            r.status = 0;
            r.desc = "failure during session search.";
          res.json(r);  
            return;
        }
        
    // if the sessions do not exist
        if (sessionObj == null)
        {
          console.log("SWITCHSESSIONOWNER:session was not found.");
            r.status = 0;
            r.desc = "session was not found.";
          res.json(r);  
            return;
        }
        
        //email received as currOwner do not belong to the session owner
        if (sessionObj.owner != currOwner)
        {
          console.log("SWITCHSESSIONOWNER:user: " + currOwner + " is not a session owner.");
            r.status = 0;
            r.desc = "user: " + currOwner + " is not a session owner.";
          res.json(r);  
            return;
        }
        else
    {
          //switch places: participant goes to be a session owner, owner goes to be participant
          sessionObj.owner = futureOwner;
          sessionObj.participants.push(currOwner);
          
          //remove new session owner from session participant list
          sessionObj.participants.splice(sessionObj.participants.indexOf(futureOwner), 1);

      //create an array of switching users
      users.push(currOwner);
      users.push(futureOwner);
      
      sessionObj.save(function(err, obj) 
        { 
          console.log("SWITCHSESSIONOWNER:save");
          if (err)
          {
            console.log("SWITCHSESSIONOWNER:failure during session save, the error: ", err);
            r.status = 0;
            r.desc = "failure during session save";
            res.json(r); 
            return;          
          }
          
            // seach for the google registration id of the users that going to make a switch
            db.model('users').find( 
        { email : { $in : users } }, 
          { regId : true, _id : false },
        function (err, arrUsers)
        {
          console.log("SWITCHSESSIONOWNER:Array of users: " + arrUsers);
          
          // failure during user search
            if (err) 
            {
              console.log("SWITCHSESSIONOWNER:failure during users search, the error: ", err);
                  r.status = 0;
                  r.desc = "failure during users search, the error: ", err;
                res.json(r);  
                return;
            }
            if ( arrUsers.length != 2 )
            {
              console.log("SWITCHSESSIONOWNER:one of the participans was not found.");
                  r.status = 0;
                  r.desc = "one of the participans was not found.";
                res.json(r);  
                return;
            }
            else
            {
            message.addData('sessionId', sessionId);
            message.delay_while_idle = 1;
            
              (arrUsers).forEach (function (user) 
              {
                  console.log("SWITCHSESSIONOWNER:participant's registration id: " + user.regId);
                  
                  if (user.email == futureOwner)
                  {
                    var newOwnerRegId = [];
                    newOwnerRegId.push(user.regId);
                  
                    message.addData('message', 'owner');
                    message.addData('status', '5');     //TODO. check for the right number
                    
                    //send a gcm message to the current session owner
                    sender.sendNoRetry(message, newOwnerRegId, function(err, sentResult) 
                {
                    if(err) 
                    {
                      console.error("SWITCHSESSIONOWNER:error is: " + err);
                    }
                    else 
                    {
                       console.log("SWITCHSESSIONOWNER:message sending to: " + user.regId + " resulted with:" + sentResult);
                      }
                });
                  } 
              else
              {
                var oldOwnerRegId = [];
                    oldOwnerRegId.push(user.regId);
                    
                    message.addData('message', 'participant');
                message.addData('status', '6');     //TODO. check for the right number            
                        
                    //send a gcm message to the previos session owner
                    sender.sendNoRetry(message, oldOwnerRegId, function(err, sentResult) 
                {
                    if(err) 
                    {
                      console.error("SWITCHSESSIONOWNER:error is: " + err);
                    }
                    else 
                    {
                       console.log("SWITCHSESSIONOWNER:message sending to: " + user.regId + " resulted with:" + sentResult);
                      }
                });
              }
              });
              
              console.log("SWITCHSESSIONOWNER:all messages were sent.");
                  r.status = 1;
                  r.desc = "all messages were sent";
                res.json(r);  
                return; 
            }
          });           
      });
    }
  });
        
}
