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
        'default_kbm_end' => env('HADIR_DEFAULT_KBM_END', '15:30'),
    ],
    'email' => [
        'student_domain' => env('HADIR_STUDENT_EMAIL_DOMAIN', 'student.smktelkom-pwt.sch.id'),
        'staff_domain' => env('HADIR_STAFF_EMAIL_DOMAIN', 'smktelkom-pwt.sch.id'),
        'parent_domain' => env('HADIR_PARENT_EMAIL_DOMAIN', 'parent.smktelkom-pwt.sch.id'),
    ],
];
