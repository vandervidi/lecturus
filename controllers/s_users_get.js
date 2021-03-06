/** @namespace users */

/**
 * @inner
 * @memberof users
 * @function getUser
 * @desc This function goes through 'email' properties in 'user' documents and searches for a suitable email.
 *  If an email, received in request, was found, this function will return 'user' document's info.
 * @param {json} data - The object with the data
 * @param {string} data.email - name@gmail.com
 * @returns {json} status: 1/0, 
 * info: the requested user data
 */

exports.getUser = function(req,res,next){
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
    if ( !data.email || data.email == "" )  // if data.email property exists in the request is not empty
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
}


/**
 * @inner
 * @memberof users
 * @function getUsersData
 * @desc This function goes through 'email' properties in 'user' documents and searches for a suitable email.
 *  If an email, received in request, was found, this function will return 'user' document's info.
 * @param {json} data - The object with the data
 * @param {array} data.users - [name@gmail.com]
 * @returns {json} status: 1/0, 
 * info: the requested user data
 */

exports.getUsersData = function(req,res,next){
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

    db.model('users').find( { email : { $in : data } },
    { _id : false, name : true, lastName : true, image : true, email : true },
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
}

/**
 * @inner
 * @memberof users
 * @function getActiveUsers
 * @desc This function goes through 'org' properties in 'user' documents and searches 
 * for a suitable organization, it will return all active users from ( with active property set to 1 ).
 * @param {json} data - The object with the data
 * @param {array} data.org - shenkar
 * @returns {json} status: 1/0, 
 * users: [active users that belong to the organization]
 */

exports.getActiveUsers = function(req,res,next){
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
    if ( !data.org || data.org == "" )  // if data.org property exists in the request is not empty
    {
        r.status = 0;   
        r.desc = "request must contain a property org";
        res.json(r); 
        return;
    }

    db.model('users').find( { org : data.org, active : true },
    { _id : false, name : true, lastName : true, image : true, email : true },
    function (err, result)
    {
        // failure during user search
        if (err) 
        {
            console.log("GETACTIVEUSERS:failure during user search, the error: ", err);
            r.uid = 0;
            r.status = 0;
            r.desc = "failure during user search";
            res.json(r);    
            return;
        }
        
        // if the user do not exist, register the user
        if (result.length)
        {
            console.log("GETACTIVEUSERS:active users: " + result + " were found in: " + data.org + " organization.");
            r.status = 1;
            r.users = result;
            r.desc = "active users were find in: " + data.org + " ogranization.";
            res.json(r);
            return;
            
        }
        else // the user not exist, function returns 0
        {
            console.log("no active users were find in: " + data.org + " ogranization.");
            r.status = 0;
            r.desc = "no active users were find in: " + data.org + " ogranization.";
            res.json(r);
            return;
        }
    }); 
}
