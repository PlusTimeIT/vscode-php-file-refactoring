<?php

namespace TestClasses\Additional;

use TestClasses\TestClass1;

class TestClass3
{
    function __construct(public TestClass1 $testClass1)
    {
    }

    function test(): TestClass1
    {
        return $this->testClass1;
    }
}
