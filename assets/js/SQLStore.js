var systemDB;

/*! Initialize the systemDB global variable. */
function initDB()
{


try {
    if (!window.openDatabase) {
        alert('not supported');
    } else {
        var shortName = 'siscb';
        var version = '2.0';
        var displayName = 'SisCB data';
        var maxSize = 3553600; // in bytes
        var myDB = openDatabase(shortName, version, displayName, maxSize);

        // You should have a database instance in myDB.

    }
} catch(e) {
    // Error handling code goes here.
    if (e == INVALID_STATE_ERR) {
        // Version number mismatch.
	alert("Versao errada do banco.");
    } else {
	alert("Erro desconhecido "+e+".");
    }
    return;
}

// alert("Database is: "+myDB);

createTables(myDB);
systemDB = myDB;

}


/*! Format a link to a document for display in the "Choose a file" pane. */
function docLink(row)
{
	var name = row['name'];
	var files_id = row['id'];

	return "<tr class='filerow'><td class='filenamecell'>"+name+"</td><td class='filelinkcell'>(<a href='#' onClick=loadFile("+files_id+")>edit</a>)&nbsp;(<a href='#' onClick=deleteFile("+files_id+")>delete</a>)</td></tr>\n";
}

/*! If a deletion resulted in a change in the list of files, redraw the "Choose a file" pane. */
function deleteUpdateResults(transaction, results)
{
	if (results.rowsAffected) {
		chooseDialog();
	}
}

/*! Mark a file as "deleted". */
function reallyDelete(id)
{
	// alert('delete ID: '+id);
	var myDB = systemDB;

	myDB.transaction(
	    new Function("transaction", "transaction.executeSql('UPDATE files set deleted=1 where id=?;', [ "+id+" ], /* array of values for the ? placeholders */"+
			"deleteUpdateResults, errorHandler);")
	);

}

/*! Ask for user confirmation before deleting a file. */
function deleteFile(id)
{
	var myDB = systemDB;
	
	myDB.transaction(
	    new Function("transaction", "transaction.executeSql('SELECT id,name from files where id=?;', [ "+id+" ], /* array of values for the ? placeholders */"+
			"function (transaction, results) {"+
				"if (confirm('Really delete '+results.rows.item(0)['name']+'?')) {"+
					"reallyDelete(results.rows.item(0)['id']);"+
				"}"+
			"}, errorHandler);")
	);
}

/*! This prints a list of "files" to edit. */
function chooseDialog()
{
	var myDB = systemDB;
	
	myDB.transaction(
	    function (transaction) {
		transaction.executeSql("SELECT * from files where deleted=0;",
			[ ], // array of values for the ? placeholders
			function (transaction, results) {
				var string = '';
				var controldiv = document.getElementById('controldiv');
				for (var i=0; i<results.rows.length; i++) {
					var row = results.rows.item(i);
					string = string + docLink(row);
				}
				if (string == "") { 
					string = "No files.<br />\n";
				} else {
					string = "<table class='filetable'>"+string+"</table>";
				}
				controldiv.innerHTML="<H1>Choose a file to edit</H1>"+string+linkToCreateNewFile();
			}, errorHandler);
	    }
	);

}

/*! This prints a link to the "Create file" pane. */
function linkToCreateNewFile()
{
	return "<p><button onClick='createNewFile()'>Create New File</button>";
}


/*! This creates a new "file" in the database. */
function createNewFileAction()
{
	var myDB = systemDB;
	var name = document.getElementById('createFilename').value

	// alert('Name is "'+name+'"');

	myDB.transaction(
		function (transaction) {
			var myfunc = new Function("transaction", "results", "/* alert('insert ID is'+results.insertId); */ transaction.executeSql('INSERT INTO files (name, filedata_id) VALUES (?, ?);', [ '"+name+"', results.insertId], nullDataHandler, killTransaction);");

        		transaction.executeSql('INSERT INTO filedata (datablob) VALUES ("");', [], 
				myfunc, errorHandler);
		}
	);

	chooseDialog();
}

/*! This saves the contents of the file. */
function saveFile()
{
	var myDB = systemDB;
	// alert("Save not implemented.\n");

	var contentdiv = document.getElementById('contentdiv');
	var contents = contentdiv.contentDocument.body.innerHTML;

	// alert('file text is '+contents);

	myDB.transaction(
		function (transaction) {
			var contentdiv = document.getElementById('contentdiv');
			var datadiv = document.getElementById('tempdata');

			var filedata_id = datadiv.getAttribute('lfdataid');
			var contents = contentdiv.contentDocument.body.innerHTML;

			transaction.executeSql("UPDATE filedata set datablob=? where id=?;",
				[ contents, filedata_id ], // array of values for the ? placeholders
				nullDataHandler, errorHandler); 
			// alert('Saved contents to '+filedata_id+': '+contents);
			var origcontentdiv = document.getElementById('origcontentdiv');
			origcontentdiv.innerHTML = contents;

			alert('Saved.');
    		}
	);
}

/*! This displays the "Create file" pane. */
function createNewFile()
{
	var myDB = systemDB;
	var controldiv = document.getElementById('controldiv');
	var string = "";

	string += "<H1>Create New File</H1>\n";
	string += "<form action='javascript:createNewFileAction()'>\n";
	string += "<input id='createFilename' name='name'>Filename</input>\n";
	string += "<input type='submit' value='submit' />\n";
	string += "</form>\n";

	controldiv.innerHTML=string;

}

/*! This processes the data read from the database by loadFile and sets up the editing environment. */
function loadFileData(transaction, results)
{
	var controldiv = document.getElementById('controldiv');
	var contentdiv = document.getElementById('contentdiv');
	var origcontentdiv = document.getElementById('origcontentdiv');
	var datadiv = document.getElementById('tempdata');

	// alert('loadFileData called.');

	var data = results.rows.item(0);
	var filename = data['name'];
	var filedata = data['datablob'];
	datadiv.setAttribute('lfdataid', parseInt(data['filedata_id']));

	document.title="Editing "+filename;
	controldiv.innerHTML="";
	contentdiv.contentDocument.body.innerHTML=filedata;
	origcontentdiv.innerHTML=filedata;
	contentdiv.style.border="1px solid #000000";
	contentdiv.style['min-height']='20px';
	contentdiv.style.display='block';
	contentdiv.contentDocument.contentEditable=true;
}

/*! This loads a "file" from the database and calls loadFileData with the results. */
function loadFile(id)
{
	// alert('Loading file with id '+id);
	var datadiv = document.getElementById('tempdata');
	datadiv.setAttribute('lfid', parseInt(id));

	myDB = systemDB;
	myDB.transaction(
		function (transaction) {
			var datadiv = document.getElementById('tempdata');
			var id = datadiv.getAttribute('lfid');
			// alert('loading id' +id);
			transaction.executeSql('SELECT * from files, filedata where files.id=? and files.filedata_id = filedata.id;', [id ], loadFileData, errorHandler);
		}
	);

}

/*! This creates the database tables. */
function createTables(db)
{

/* To wipe out the table (if you are still experimenting with schemas,
   for example), enable this block. */
if (0) {
	db.transaction(
	    function (transaction) {
		transaction.executeSql('DROP TABLE files;');
		transaction.executeSql('DROP TABLE filedata;');
	    }
	);
}

db.transaction(
    function (transaction) {
        transaction.executeSql('CREATE TABLE IF NOT EXISTS files(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, filedata_id INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0);', [], nullDataHandler, killTransaction);
        transaction.executeSql('CREATE TABLE IF NOT EXISTS filedata(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, datablob BLOB NOT NULL DEFAULT "");', [], nullDataHandler, errorHandler);
    }
);

}

/*! When passed as the error handler, this silently causes a transaction to fail. */
function killTransaction(transaction, error)
{
	return true; // fatal transaction error
}

/*! When passed as the error handler, this causes a transaction to fail with a warning message. */
function errorHandler(transaction, error)
{
    // Error is a human-readable string.
    alert('Oops.  Error was '+error.message+' (Code '+error.code+')');

    // Handle errors here
    var we_think_this_error_is_fatal = true;
    if (we_think_this_error_is_fatal) return true;
    return false;
}

/*! This is used as a data handler for a request that should return no data. */
function nullDataHandler(transaction, results)
{
}

/*! This returns a string if you have not yet saved changes.  This is used by the onbeforeunload
    handler to warn you if you are about to leave the page with unsaved changes. */
function saveChangesDialog(event)
{
    var contentdiv = document.getElementById('contentdiv');
    var contents = contentdiv.contentDocument.body.innerHTML;
    var origcontentdiv = document.getElementById('origcontentdiv');
    var origcontents = origcontentdiv.innerHTML;

    // alert('close dialog');

    if (contents == origcontents) {
	return NULL;
    }

    return "You have unsaved changes."; //   CMP "+contents+" TO "+origcontents;
}

/*! This sets up an onbeforeunload handler to avoid accidentally navigating away from the
    page without saving changes. */
function setupEventListeners()
{
    window.onbeforeunload = function () {
	return saveChangesDialog();
    };
}

