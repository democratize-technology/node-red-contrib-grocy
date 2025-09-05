const Validators = require('../../nodes/lib/validators');
const ConfigValidators = require('../../nodes/lib/validators/config-validators');

describe('Security Integration Tests', () => {
  describe('Path Traversal Protection in File Operations', () => {
    describe('Direct traversal attempts', () => {
      it('should block ../ patterns', () => {
        const dangerousPaths = [
          { group: 'images', fileName: '../etc/passwd' },
          { group: 'data', fileName: '../../root/.ssh/id_rsa' },
          { group: 'files', fileName: 'subfolder/../../config.json' }
        ];

        dangerousPaths.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/Path traversal attempt detected/);
        });
      });

      it('should block ..\\ Windows patterns', () => {
        const dangerousPaths = [
          { group: 'images', fileName: '..\\windows\\system32' },
          { group: 'data', fileName: '..\\..\\windows\\system.ini' }
        ];

        dangerousPaths.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/Path traversal attempt detected/);
        });
      });
    });

    describe('URL-encoded traversal attempts', () => {
      it('should block single-encoded traversal', () => {
        const dangerousPaths = [
          { group: 'files', fileName: '%2e%2e%2fetc%2fpasswd' },
          { group: 'data', fileName: '%2e%2e%5cwindows%5csystem32' }
        ];

        dangerousPaths.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/(URL-encoded path traversal|Invalid URL encoding)/);
        });
      });

      it('should block double-encoded traversal', () => {
        const dangerousPaths = [
          { group: 'files', fileName: 'data%252f%252e%252e%252fetc' },
          { group: 'images', fileName: 'folder%255c%252e%252e%255cwindows' }
        ];

        dangerousPaths.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/Double-encoded path traversal attempt detected/);
        });
      });
    });

    describe('Absolute path attempts', () => {
      it('should block Unix absolute paths', () => {
        const absolutePaths = [
          { group: 'files', fileName: '/etc/passwd' },
          { group: 'data', fileName: '/var/log/syslog' }
        ];

        absolutePaths.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/Absolute paths are not allowed/);
        });
      });

      it('should block Windows absolute paths', () => {
        const absolutePaths = [
          { group: 'files', fileName: 'C:\\Windows\\System32\\config' },
          { group: 'data', fileName: 'D:\\secrets\\passwords.txt' }
        ];

        absolutePaths.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/Absolute paths are not allowed/);
        });
      });

      it('should block UNC paths', () => {
        const uncPaths = [
          { group: 'files', fileName: '\\\\server\\share\\file.txt' },
          { group: 'data', fileName: '\\\\192.168.1.1\\admin$' }
        ];

        uncPaths.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/(UNC paths are not allowed|Absolute paths are not allowed)/);
        });
      });
    });

    describe('Null byte and control character protection', () => {
      it('should block null bytes in file paths', () => {
        const nullBytePaths = [
          { group: 'files', fileName: 'file.txt\0.jpg' },
          { group: 'data', fileName: 'document\0/../../etc/passwd' }
        ];

        nullBytePaths.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/null bytes/);
        });
      });

      it('should block control characters', () => {
        const controlCharPaths = [
          { group: 'files', fileName: 'file\x01.txt' },
          { group: 'data', fileName: '\x7fdocument.pdf' }
        ];

        controlCharPaths.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/control characters/);
        });
      });
    });

    describe('Sensitive file protection', () => {
      it('should block access to sensitive files', () => {
        const sensitiveFiles = [
          { group: 'config', fileName: '.htaccess' },
          { group: 'config', fileName: '.env' },
          { group: 'backup', fileName: 'database.sql.bak' },
          { group: 'temp', fileName: 'passwords.txt.swp' },
          { group: 'config', fileName: '.git/config' }
        ];

        sensitiveFiles.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/blocked pattern/);
        });
      });
    });

    describe('File group validation', () => {
      it('should block dangerous group names', () => {
        const dangerousGroups = [
          { group: '../etc', fileName: 'file.txt' },
          { group: '..\\windows', fileName: 'file.txt' },
          { group: 'files/../../', fileName: 'document.pdf' },
          { group: '/root', fileName: 'file.txt' },
          { group: 'C:\\Windows', fileName: 'file.txt' }
        ];

        dangerousGroups.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow();
        });
      });

      it('should reject groups with special characters', () => {
        const invalidGroups = [
          { group: 'user files', fileName: 'doc.txt' },
          { group: 'user@files', fileName: 'doc.txt' },
          { group: 'user;files', fileName: 'doc.txt' },
          { group: 'user|files', fileName: 'doc.txt' }
        ];

        invalidGroups.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/must contain only alphanumeric characters/);
        });
      });
    });

    describe('Valid file operations', () => {
      it('should allow safe file paths', () => {
        const safePaths = [
          { group: 'userfiles', fileName: 'document.pdf' },
          { group: 'product-images', fileName: 'item_123.jpg' },
          { group: 'data_2023', fileName: 'reports/january.csv' },
          { group: 'uploads', fileName: 'user123/profile.png' }
        ];

        safePaths.forEach(params => {
          expect(() => {
            const result = Validators.validateFileParams(params);
            expect(result).toHaveProperty('group');
            expect(result).toHaveProperty('fileName');
            expect(typeof result.fileName).toBe('string');
          }).not.toThrow();
        });
      });

      it('should normalize safe paths correctly', () => {
        const result = Validators.validateFileParams({
          group: 'images',
          fileName: './subfolder/image.jpg'
        });

        // Should normalize ./subfolder to subfolder
        expect(result.fileName).toMatch(/^subfolder/);
      });

      it('should enforce file extension restrictions when specified', () => {
        const options = {
          allowedExtensions: ['.jpg', '.png', '.gif']
        };

        // Should allow specified extensions
        expect(() => {
          Validators.validateFileParams({
            group: 'images',
            fileName: 'photo.jpg'
          }, options);
        }).not.toThrow();

        // Should block other extensions
        expect(() => {
          Validators.validateFileParams({
            group: 'images',
            fileName: 'document.pdf'
          }, options);
        }).toThrow(/File extension not allowed/);
      });
    });

    describe('Error types and messages', () => {
      it('should throw security errors with proper categorization', () => {
        try {
          Validators.validateFileParams({
            group: 'files',
            fileName: '../etc/passwd'
          });
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.message).toMatch(/Security violation/);
          expect(error.type).toBe('security');
          expect(error.category).toBe('security');
          expect(error.severity).toBe('critical');
        }
      });

      it('should provide helpful error details without exposing sensitive data', () => {
        try {
          Validators.validateFileParams({
            group: 'files',
            fileName: '../../etc/shadow'
          });
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.message).toBeTruthy();
          // Should not expose the actual malicious path
          expect(error.attemptedValue).toBe('[REDACTED]');
        }
      });
    });

    describe('Cross-platform compatibility', () => {
      it('should handle mixed path separators correctly', () => {
        const mixedPaths = [
          { group: 'files', fileName: 'folder/subfolder\\file.txt' },
          { group: 'data', fileName: 'reports\\2023/january.csv' }
        ];

        mixedPaths.forEach(params => {
          expect(() => {
            const result = Validators.validateFileParams(params);
            expect(result.fileName).toBeTruthy();
          }).not.toThrow();
        });
      });

      it('should block traversal with mixed separators', () => {
        const dangerousPaths = [
          { group: 'files', fileName: '../..\\etc/passwd' },
          { group: 'data', fileName: '..\\../windows/system32' }
        ];

        dangerousPaths.forEach(params => {
          expect(() => {
            Validators.validateFileParams(params);
          }).toThrow(/Path traversal attempt detected/);
        });
      });
    });
  });
});