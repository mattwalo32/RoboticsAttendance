<?php
	$result = new stdClass();
	$ID = $_GET["ID"];
	$action = $_GET["ACTION"];

	require("QRAttendence.html?ID=190&ACTION=SIGNIN");
	// if($action == "SIGNIN")
	// {
	// 	checkIn();
	// }
	// else
	// {
	// 	checkOut();
	// }

?>