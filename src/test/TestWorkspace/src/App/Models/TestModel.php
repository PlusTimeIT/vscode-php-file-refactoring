<?php

namespace App\Models;

use App\TestBase as Base;

/**
 * Used to check alias converts successfully
 */
class TestModel
{
    function __construct(public Base $testBase)
    {
    }

    function test(): Base
    {
        return $this->testBase;
    }
}
