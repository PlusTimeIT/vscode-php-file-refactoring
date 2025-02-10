<?php

namespace App\Controllers;

use App\TestBase;

/**
 * Used to check name converts successfully
 */
class TestController
{
    function __construct(public TestBase $testBase)
    {
    }

    function test(): TestBase
    {
        return $this->testBase;
    }
}