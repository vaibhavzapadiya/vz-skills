import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class FooTest {
    @Test
    void adds() { assertEquals(2, new Foo().add(1, 1)); }
}
