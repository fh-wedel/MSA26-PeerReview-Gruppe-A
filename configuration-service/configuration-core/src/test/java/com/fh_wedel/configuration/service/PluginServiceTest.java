package com.fh_wedel.configuration.service;

import com.fh_wedel.configuration.config.PluginProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PluginServiceTest {

    @Test
    void loadPlugins_throwsWhenDirectoryDoesNotExist() {
        PluginProperties props = mock(PluginProperties.class);
        when(props.directory()).thenReturn("/non/existent/path/12345");
        
        PluginService service = new PluginService(props);
        
        assertThatThrownBy(service::loadPlugins)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Plugin directory does not exist");
    }

    @Test
    void loadPlugins_throwsWhenNoJarsFound(@TempDir Path tempDir) {
        PluginProperties props = mock(PluginProperties.class);
        when(props.directory()).thenReturn(tempDir.toString());
        
        PluginService service = new PluginService(props);
        
        assertThatThrownBy(service::loadPlugins)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No JAR files found in plugin directory");
    }

    @Test
    void loadPlugins_throwsWhenJarsContainNoImplementations(@TempDir Path tempDir) throws Exception {
        PluginProperties props = mock(PluginProperties.class);
        when(props.directory()).thenReturn(tempDir.toString());
        
        // Create an empty dummy jar
        java.nio.file.Files.createFile(tempDir.resolve("dummy.jar"));
        
        PluginService service = new PluginService(props);
        
        assertThatThrownBy(service::loadPlugins)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No ReviewTypePlugin implementations found");
    }
}
