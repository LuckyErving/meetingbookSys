const bcrypt = require('bcrypt');
const { User } = require('../src/models');
const { sequelize } = require('../src/config/db');

async function resetPasswords() {
    try {
        await sequelize.authenticate();
        console.log('数据库连接成功');

        // 定义用户的明文密码
        const userPasswords = [
            { username: 'yyw', password: 'yyw123' },
            { username: 'admin', password: 'admin123' },
            { username: 'leader1', password: 'leader123' },
            { username: 'tech1', password: 'tech123' },
            { username: 'support1', password: 'support123' },
            { username: 'finance1', password: 'finance123' },
            { username: 'zhangsan', password: 'zhangsan123' },
            { username: 'lisi', password: 'lisi123' },
            { username: 'wangwu', password: 'wangwu123' },
            { username: 'zhaoliu', password: 'zhaoliu123' }
        ];

        console.log('开始重置用户密码...');

        for (const userInfo of userPasswords) {
            try {
                // 加密密码
                const hashedPassword = await bcrypt.hash(userInfo.password, 10);
                
                // 更新用户密码
                const [updatedRows] = await User.update(
                    { password: hashedPassword },
                    { where: { username: userInfo.username } }
                );

                if (updatedRows > 0) {
                    console.log(`✓ 用户 ${userInfo.username} 密码重置成功，新密码: ${userInfo.password}`);
                } else {
                    console.log(`✗ 用户 ${userInfo.username} 不存在`);
                }
            } catch (error) {
                console.error(`✗ 重置用户 ${userInfo.username} 密码失败:`, error.message);
            }
        }

        console.log('\n密码重置完成！');
        console.log('\n可用的登录账号：');
        userPasswords.forEach(user => {
            console.log(`用户名: ${user.username}, 密码: ${user.password}`);
        });

    } catch (error) {
        console.error('重置密码失败:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

// 运行脚本
resetPasswords();
