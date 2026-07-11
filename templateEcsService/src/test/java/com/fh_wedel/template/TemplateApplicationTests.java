package com.fh_wedel.template;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import io.awspring.cloud.sqs.operations.SqsTemplate;

@SpringBootTest
class TemplateApplicationTests {

    @MockitoBean
    private SqsTemplate sqsTemplate;

	@Test
	void contextLoads() {
	}

}
