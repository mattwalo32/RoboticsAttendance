			/**
			  * Calculates the amount of hours left in preseason and buildSeason.
			  *
			  * Any timestamp values should be set to 12:00 AM of the desired date, and should
			  * be in seconds. To get the timestamp of a certain date visit a website, such as
			  * https://www.epochconverter.com/ and enter the month, date, and year of the desired date.
			  * Make sure that hours is set to 1, and mins and seconds are both 0.
			  * IMPORTANT: Ensure that the timezone is set to the local timezone, Central Standard Time (CST), or GMT - 5
			  *
			  * @author Matthew Walowski
			  */

			// Initialize Firebase
			// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
			const functions = require('firebase-functions');

			// The Firebase Admin SDK to access the Firebase Realtime Database.
			const admin = require('firebase-admin');
			admin.initializeApp();

			//THIS CONFIG VARIABLE SHOULD BE CHANGED IF CHANGING FIREBASE ACCOUNTS TO LINK TO
			//var config = {
			//	apiKey: "AIzaSyD5eHK1aPWkkI30DCIAMXYknPBGLIxjsJM",
			//	authDomain: "trident-robotics-attendance.firebaseapp.com",
			//	databaseURL: "https://trident-robotics-attendance.firebaseio.com",
			//	projectId: "trident-robotics-attendance",
			//	storageBucket: "trident-robotics-attendance.appspot.com",
			//	messagingSenderId: "609506036733"
			//};
			//firebase.initializeApp(config);
			
			// Get reference to database
			//var database = firebase.database();

			var weekInSeconds = 7 * 24 * 60 * 60;

			// Variables about meeting frequency
			var weekMeetingDuration = 4.5;
			var weekendMeetingDuration = 8;
			var preseasonWeeks = 19;
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

			//There will be a map for both seasons. The key will be the timestamp of the meeting date, and the value will be the meeting duration in hours.
			var preseasonDates = new Map();
			var buildSeasonDates = new Map();

			var availablePreseasonHours;
			var availableBuildSeasonHours;
			var currentTime;

			calculateHours();

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


							//If this meeting's date has not passed
							if(key + weekAccumulator >= currentTime)
							{
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
			}

			function calculateHours()
			{
				init();

				//Compile the list of the dates
				setDates(firstPreseasonMeetings, preseasonDates, preseasonWeeks, true);
				setDates(firstBuildSeasonMeetings, buildSeasonDates, buildSeasonWeeks, false);

				updateHours("preseason", availablePreseasonHours);
				updateHours("buildSeason", availableBuildSeasonHours);

				alert("There are " + availablePreseasonHours.toString() + " left in preseason.");
				alert("There are " + availableBuildSeasonHours + " left in Build Season.");
			}

			function init()
			{
				availablePreseasonHours = 0;
				availableBuildSeasonHours = 0;
				currentTime = Math.floor(Date.now() / 1000);
			}

			function updateHours(seasonName, hours)
			{
				exports.updateHours = functions.https.onRequest((req, res) => {
					return admin.database().ref(seasonName).update(
					{
						availableHours: hours
					}).then((snapshot) => {
						return res.redirect(303, snapshot.ref.toString());
					});

				});
			}