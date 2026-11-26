<?php

return [
    'school' => [
        'name' => env('HADIR_SCHOOL_NAME', 'SMK Telkom Purwokerto'),
        'address' => 'Jl. D.I. Panjaitan No. 128, Purwokerto Selatan, Banyumas',
        'latitude' => (float) env('HADIR_SCHOOL_LAT', -7.435210),
        'longitude' => (float) env('HADIR_SCHOOL_LNG', 109.249210),
        'radius_meters' => (float) env('HADIR_SCHOOL_RADIUS_METERS', 150),
    ],
    'attendance' => [
        'check_in_deadline' => env('HADIR_CHECKIN_DEADLINE', '07:00'),
        'warning_minutes_before' => (int) env('HADIR_WARNING_MINUTES_BEFORE', 10),
    ],
];
