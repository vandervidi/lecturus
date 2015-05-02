var express = require('express');
var fs = require("fs-extra");
var router = express.Router();

router.get('/users', function (req, res) 
{
	res.render('users',
	{
		title:"Users API"
	});
	
});

/* /users/registerUser -- precondition
 *	This function must receive json with email: user id, any other fields: active true/false.  
 *
 * /users/registerUser -- postcondition
 *	This function will return json with status: 1 = success / 0 = failure.
 *
 * /users/registerUser -- description
 * 	This function goes through 'email' properties in 'user' documents and searches for a suitable email.
 *	If an email, received in request, was not found, this function will insert new 'user' document into 'users' collection in mongodb.
 *
 * /users/registerUser -- example
 *	email		vandervidi@gmail.com
*/
router.post("/users/registerUser", function(req, res) 
{
	var r = { };
	
    try
    {
        //try to parse json data
    	var data = req.body;
    }
     catch( err )
    {
  		console.log("failure while parsing the request, the error:" + err);
    	r.status = 0;
    	r.desc = "failure while parsing the request";
    	res.json(r);
    	return;
    }
    if ( !data.email || data.email == "" || !data.org || data.org == "" )	// if data.email and data.org property exists in the request is not empty
    {
    	r.status = 0;	
        r.desc = "request must contain a property email";
        res.json(r); 
        return;
    }

    db.model('users').find( { email : data.email },
    { _id:false ,active:false, timestamp:false, favorites:false, owner:false },
    function (err, result)
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
        
        // if the user do not exist, register the user
        if (!result.length)
        {
        	//console.log("result ",result)
        	data.timestamp = new Date().getTime();
        	data.active = true;
        	
        	console.log("register new user "+data.email)
            // insert new user to users collection 
            var newUser =  new User(data);
			newUser.save(function (err) {
			  	// saved!
			  	// failure during insertion of new user
                if (err) 
                {
                 	console.log("failure during insertion of new user, the error: ", err);
                 	r.uid = 0;
                  	r.status = 0;
                  	r.desc = "failure during insertion of new user";
                 	res.json(r);
                  	return;
                }
                else
                {
                    console.log("user: " + data.email + " has completed successfully.");
                    r.uid = data.email;
                    r.status = 1;
                    r.desc = "user: " + data.email + " has completed successfully.";
                    res.json(r);
                    return;	                        	
                }
			});
			
        }
		else // the user exists, function returns 2 (exist)
		{
			console.log("user: " + data.email + " already exists in the system.");
			r.uid = data.email;
			r.info = result[0];					
			r.status = 2;
			r.desc = "user: " + data.email + " already exists in the system.";
			res.json(r);
			return;
		}
    });
});

/* /users/getUser -- precondition
 *	This function must receive json with email: user id, any other fields: active true/false.
 *
 * /users/getUser -- postcondition
 *	This function will return json with status: 1 = success / 0 = failure, and 'user' data.
 * 
 * /users/getUser -- description
 * 	This function goes through 'email' properties in 'user' documents and searches for a suitable email.
 *	If an email, received in request, was found, this function will return 'user' document's info.
 * 
 * /users/getUser -- example
 *	email		vandervidi@gmail.com
*/
router.post("/users/getUser", function( req, res ) 
{
	var r = { };
	
    try
    {
        //try to parse json data
    	var data = req.body;
    }
     catch( err )
    {
  		console.log("failure while parsing the request, the error:" + err);
    	r.status = 0;
    	r.desc = "failure while parsing the request";
    	res.json(r);
    	return;
    }
    if ( !data.email || data.email == "" )	// if data.email property exists in the request is not empty
    {
    	r.status = 0;	
        r.desc = "request must contain a property email";
        res.json(r); 
        return;
    }

    db.model('users').find( { email : data.email },
    { _id:false ,name:true, lastName:true, image:true, email:true, org:true },
    function (err, result)
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
        
        
        if (result.length)
        {
        	console.log("user: " + data.email + " exists in the system.");
			r.uid = data.email;
			r.info = result[0];					
			r.status = 1;
			r.desc = "user: " + data.email + " exists in the system.";
			res.json(r);
			return;
			
        }
		else // the user not exist, function returns 0
		{
			console.log("user: " + data.email + " not exist in the system.");
			r.uid = data.email;
			r.status = 0;
			r.desc = "user: " + data.email + " not exist in the system.";
			res.json(r);
			return;
		}
    });   
});

/* /users/getUsersData -- precondition
 *  This function must receive json array with email called users
 *
 * /users/getUsersData -- postcondition
 *  This function will return json with status: 1 = success / 0 = failure, and all 'users' data.
 * 
 * /users/getUsersData -- description
 *  This function goes through 'email' properties in 'user' documents and searches for a suitable email.
 *  If an email, received in request, was found, this function will return 'user' document's info.
 * 
 * /users/getUsersData -- example
 *  users[0]       vandervidi@gmail.com
 *  users[1]       avishayhajbi@gmail.com
*/
router.post("/users/getUsersData", function( req, res ) 
{
    var r = { };
    
    try
    {
        //try to parse json data
        var data = req.body.users;
    }
     catch( err )
    {
        console.log("failure while parsing the request, the error:" + err);
        r.status = 0;
        r.desc = "failure while parsing the request";
        res.json(r);
        return;
    }
    if ( !data || data.length == 0 )  // if data.email property exists in the request is not empty
    {
        r.status = 0;   
        r.desc = "request must contain a property users or its empty";
        res.json(r); 
        return;
    }

    db.model('users').find( { email:{ $in : data} },
    { _id:false ,name:true, lastName:true, image:true, email:true },
    function (err, result)
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
        
        
        if (result.length)
        {
            console.log("user: " + data + " exists in the system.");
            r.uid = data;
            r.users = result;                 
            r.status = 1;
            r.desc = "user: " + data.email + " exists in the system.";
            res.json(r);
            return;
            
        }
        else // the user not exist, function returns 0
        {
            console.log("user: " + data.email + " not exist in the system.");
            r.uid = data.email;
            r.status = 0;
            r.desc = "user: " + data.email + " not exist in the system.";
            res.json(r);
            return;
        }
    });   
});

/* /users/getActiveUsers -- precondition
 *	This function must receive json with org. 
 *
 * /users/getActiveUsers -- postcondition
 *	This function will return json with status: 1 = success / 0 = failure, users: array[all active users that belong to the organization].
 *	
 * /users/registerUser -- description 
 * This function goes through 'org' properties in 'user' documents and searches for a suitable organization, it will return all active users from ( with active property set to 1 ).
 *  	
 * /users/registerUser -- example
 * org		shenkar
*/
router.post("/users/getActiveUsers", function( req, res ) 
{

	var r = { };
	
    try
    {
        //try to parse json data
    	var data = req.body;
    }
     catch( err )
    {
  		console.log("failure while parsing the request, the error:" + err);
    	r.status = 0;
    	r.desc = "failure while parsing the request";
    	res.json(r);
    	return;
    }
    if ( !data.org || data.org == "" )	// if data.org property exists in the request is not empty
    {
    	r.status = 0;	
        r.desc = "request must contain a property org";
        res.json(r); 
        return;
    }

    db.model('users').find( { org : data.org, active : true },
    { _id:false ,name:true, lastName:true, image:true, email:true },
    function (err, result)
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
        
        // if the user do not exist, register the user
        if (result.length)
        {
        	console.log("active users: " + result + " were found in this: " + data.org + " organization.");
            r.status = 1;
            r.users = result;
            r.desc = "active users were find in this: " + data.org + " ogranization.";
            res.json(r);
			return;
			
        }
		else // the user not exist, function returns 0
		{
			console.log("no active users were find in this: " + data.org + " ogranization.");
            r.status = 0;
            r.desc = "no active users were find in this: " + data.org + " ogranization.";
            res.json(r);
			return;
		}
    }); 
});

/* /users/updateUser -- precondition
 *	This function must receive json with email: user id, any other fields: active true/false.  
 *
 * /users/updateUser -- postcondition
 *	This function will return json with status: 1 = success / 0 = failure.
 *
 * /users/updateUser -- description
 * 	This function goes through 'email' properties in 'user' documents and searches for a suitable email.
 *	If an email, received in request, was found, this function will update 'user' document with new information.
 *
 * /users/updateUser -- example
 *	email		vandervidi@gmail.com
*/
router.post("/users/updateUser", function(req, res) 
{

	var r = { };
	
    try
    {
        //try to parse json data
    	var data = req.body;
    }
     catch( err )
    {
  		console.log("failure while parsing the request, the error:" + err);
    	r.status = 0;
    	r.desc = "failure while parsing the request";
    	res.json(r);
    	return;
    }
    if ( !data.email || data.email == "" )	// if data.email property exists in the request is not empty
    {
    	r.status = 0;	
        r.desc = "request must contain a property org";
        res.json(r); 
        return;
    }

	db.model('users').findOneAndUpdate({email: data.email}, data , {upsert:false},
    function (err, result)
    {
    	console.log(result)
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
        else if (result)
        {
        	console.log("updated user: " + data.email);
            r.status = 1;
            r.desc = "updated user successfully";
            res.json(r);
			return;
			
        }
        else
        {
        	console.log("user was not found: " + data.email);
            r.status = 0;
            r.desc = "user was not found";
            res.json(r);
			return;
			
        }
		
    }); 
});

/* /users/subscribe -- precondition
 *  This function must receive json with email: user id, and sessionId  
 *
 * /users/subscribe -- postcondition
 *  This function will return json with status: 1 = success / 0 = failure.
 *
 * /users/subscribe -- description
 *  This function goes through 'email' properties in 'user' documents and searches for a suitable email.
 *  then if the email found the sessionId will be store in the user subscribe list IF the sessionId already
 *  was there it will deleted
 *
 * /users/subscribe -- example
 *  email       vandervidi@gmail.com
 *  userToFollow  "avishayhajbi@gmail.com"
*/
router.post("/users/subscribe", function(req, res) 
{

    var r = { };
    
    try
    {
        //try to parse json data
        var data = req.body;
    }
     catch( err )
    {
        console.log("failure while parsing the request, the error:" + err);
        r.status = 0;
        r.desc = "failure while parsing the request";
        res.json(r);
        return;
    }
    if ( !data.email || data.email == "" )
    {
        r.status = 0;   
        r.desc = "request must contain a property org";
        res.json(r); 
        return;
    }

    db.model('users').findOne({email: data.email} , {upsert:false},
    function (err, result)
    {
        console.log(result)
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
        else if (result)
        {
            var index= result.subscribe.indexOf(data.userToFollow);
            if (index > -1)
            {
                result.subscribe.splice(index, 1);
            }
            else
            {
                result.subscribe.push(data.userToFollow);
            }
            result.save(function(err, obj) 
            { 
                if (err)
                {
                    console.log("failed to update user subscribe list");
                    r.status = 0;
                    r.desc = "failed to update user subscribe list";
                    res.json(r);
                    return;          
                }
                console.log("user subscribe list updated successfully");
                r.status = 1;
                r.desc = "user subscribe list updated successfully";
                res.json(r);
                return; 
            });
        }
        else
        {
            console.log("user was not found: " + data.email);
            r.status = 0;
            r.desc = "user was not found";
            res.json(r);
            return;
            
        }
        
    }); 
});
module.exports = router;
