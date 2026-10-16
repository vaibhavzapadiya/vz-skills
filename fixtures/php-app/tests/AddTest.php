<?php
use PHPUnit\Framework\TestCase;

final class AddTest extends TestCase
{
    public function testAdds(): void
    {
        $this->assertSame(2, 1 + 1);
    }
}
