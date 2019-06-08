var weekInSeconds = 604800;

// Variables about meeting frequency
var weekMeetingDuration = 4.5;
var weekendMeetingDuration = 8;
var preseasonWeeks = 14;
var buildSeasonWeeks = 6;

// This map contains the first week of meetings for preseason. This should contain the timestamps of each meeting date for the first week of preseason.
// For example, if we will meet on Tuesdays and Thursdays, put the timestamp of the first Tuesday and Thursdays that we will meet. Timestamps should be set
// to 12:00 AM of the meeting date. The key of each entry should be the timestamp, and the value should be the regular amount of hours that should be expected
// for that day of the week.
var firstPreseasonMeetings = new Map();

firstPreseasonMeetings.set(1536037200, weekMeetingDuration); //Tuesday, September 4th, 2018, 12:00 AM
firstPreseasonMeetings.set(1536210000, weekMeetingDuration); //Thursday, September 6th, 2018, 12:00 AM

var firstBuildSeasonMeetings = new Map();

firstBuildSeasonMeetings.set(1546668000, weekendMeetingDuration); //Saturday, January 5th, 2019, 12:00 AM
firstBuildSeasonMeetings.set(1546840800, weekMeetingDuration); //Monday, January 7th, 2019, 12:00 AM
firstBuildSeasonMeetings.set(1546927200, weekMeetingDuration); //Tuesday, January 8th, 2019, 12:00 AM
firstBuildSeasonMeetings.set(1547013600, weekMeetingDuration); //Wednesday, January 9th, 2019, 12:00 AM
firstBuildSeasonMeetings.set(1547100000, weekMeetingDuration); //Thursday, January 10th, 2019, 12:00 AM

// In the excluded dates array, put any dates that should be excluded in the regular schedule. For example, if we normally meet
// on Tuesdays and Thursdays, and we won't meet a specific Tuesday, put the timestamp of that date at 12:00AM in the array.
// Put any excluded dates for both preseason and buildSeason in here
var excludedDates = [];

var manuallyAddedBuildseason = new Map();
manuallyAddedBuildseason.set(1547100000 + 3024000 + 86400 * 2, weekendMeetingDuration);
manuallyAddedBuildseason.set(1547100000 + 3024000 + 86400 * 4, weekMeetingDuration);
manuallyAddedBuildseason.set(1547100000 + 3024000 + 86400 * 5, 7.5); //Stop Build Date

//There will be a map for both seasons. The key will be the timestamp of the meeting date, and the value will be the meeting duration in hours.
var preseasonDates = new Map();
var buildSeasonDates = new Map();

var availablePreseasonHours = 0;
var availableBuildSeasonHours = 0;
var currentTime;

function setDates(firstDates, dateList, numWeeks, preseason)
{	
	let weekAccumulator = 0;
	let dateIsExcluded = false;

	//For each week of preseason
	for(let i = 0; i < numWeeks; i++)
	{
		//For each day of the week that we are planning to meet
		for (var [key, value] of firstDates)
		{
			//Always assum the date that we are going to add is not excluded
			dateIsExcluded = false;
			excludedDates.forEach(function(excludedDate)
			{
				//if(i >13)
				//alert(key + weekAccumulator);
				//Loop through all excluded dates, and see if an excluded date matches the date we are going to add
				if(excludedDate == key + weekAccumulator)
				{
					dateIsExcluded = true;
				}
			});

			//Only add the date if it is not excluded
			if(!dateIsExcluded)
			{
				// This puts the timestamp of each meeting day (key) and duration of the meeting (value)
				// in the passed in map.
				dateList.set(key + weekAccumulator, value);

				//console.log("Meeting: " + (key + weekAccumulator) + " " + currentTime);
				//If this meeting's date has not passed
				if(key + weekAccumulator >= currentTime)
				{
					console.log(formatTimestamp(key+weekAccumulator) + " " + key + weekAccumulator);
					//If we are calculating preseason
					if(preseason)
					{
						availablePreseasonHours += value;
					}
					else
					{
						availableBuildSeasonHours += value;
					}
				}
			}
		}

		//Add on another week
		weekAccumulator += weekInSeconds;
	}
	addManualDates(preseason);
}

function addManualDates(preseason)
{
	if(!preseason)
	{
		//For each day of the week that we are planning to meet
		for (var [key, value] of manuallyAddedBuildseason)
		{
			if(key >= currentTime)
			{
				console.log(formatTimestamp(key) + " " + key);
				//If we are calculating preseason
				availableBuildSeasonHours += value;
			}
				
		}
	}
}

function calculateHours(databaseRef)
{
	initialize();

	//Compile the list of the dates
	setDates(firstPreseasonMeetings, preseasonDates, preseasonWeeks, true);
	setDates(firstBuildSeasonMeetings, buildSeasonDates, buildSeasonWeeks, false);

	updateHours("preseason", availablePreseasonHours, databaseRef);
	updateHours("buildSeason", availableBuildSeasonHours, databaseRef);

	// alert("There are " + availablePreseasonHours + " left in preseason.");
	// alert("There are " + availableBuildSeasonHours + " left in Build Season.");
	console.log(availableBuildSeasonHours);
	console.log(availablePreseasonHours);

}

function initialize()
{
	availablePreseasonHours = 0;
	availableBuildSeasonHours = 0;
	currentTime = Math.floor(Date.now() / 1000);
}

function updateHours(seasonName, hours, database)
{
	database.ref(seasonName).update(
	{
		availableHours: hours
	});
}

/** Formats the unix timestamp into a readable date
  *
  * @param timestamp The unix timestamp to format
  * @returns The string version of the readable stamp
  */
function formatTimestamp(timestamp)
{
	var a = new Date(timestamp * 1000);
	var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours() % 12;
	var min = a.getMinutes().toString().length == 1 ? "0" + a.getMinutes(): a.getMinutes();
	var sec = a.getSeconds();
	var time = month + ' ' + date + ', ' + year + ' ' + hour + ':' + min;

	return time;
}