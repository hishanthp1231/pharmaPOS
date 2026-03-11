const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function testUserManagement() {
    try {
        console.log('1. Login SuperAdmin...');
        let res = await axios.post(`${BASE_URL}/auth/login`, { username: 'superadmin', password: 'password123' });
        const superToken = res.data.token;
        if (!superToken) throw new Error('No Token');
        console.log('   PASS');

        console.log('2. Create Branch DT2...');
        try {
            await axios.post(`${BASE_URL}/branches`, { name: 'Downtown 2', code: 'DT2', address: '789 Main St', contact: '555-9999' }, { headers: { Authorization: `Bearer ${superToken}` } });
        } catch (e) { /* ignore duplicate */ }

        res = await axios.get(`${BASE_URL}/branches`, { headers: { Authorization: `Bearer ${superToken}` } });
        const branchId = res.data.branches.find(b => b.code === 'DT2')?.id;
        if (!branchId) throw new Error('Branch DT2 not found in list');
        console.log('   PASS (ID:', branchId, ')');

        console.log('3. Create Branch Admin...');
        const adminUsername = `dt2_admin_${Date.now()}`;
        try {
            await axios.post(`${BASE_URL}/user-management/branch-admin`, {
                username: adminUsername, email: `${adminUsername}@test.com`, password: 'password123', name: 'DT2 Admin', contact: '1234567890', branchId
            }, { headers: { Authorization: `Bearer ${superToken}` } });
            console.log('   PASS');
        } catch (e) { console.log('   FAIL', e.message); }

        console.log('4. Login Branch Admin...');
        res = await axios.post(`${BASE_URL}/auth/login`, { username: adminUsername, password: 'password123', branchId });
        const adminToken = res.data.token;
        if (!adminToken) throw new Error('No Admin Token');
        console.log('   PASS');

        console.log('5. Create Branch User...');
        const userUsername = `dt2_user_${Date.now()}`;
        await axios.post(`${BASE_URL}/user-management/branch-user`, {
            username: userUsername, email: `${userUsername}@test.com`, password: 'password123', name: 'DT2 User', contact: '000', branchId
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('   PASS');

        console.log('6. Verify User List...');
        res = await axios.get(`${BASE_URL}/user-management/branch/${branchId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
        if (res.data.users.some(u => u.username === userUsername)) console.log('   PASS');
        else throw new Error('User not found in list');

        console.log('7. Test Isolation...');
        try {
            await axios.get(`${BASE_URL}/user-management/branch/1`, { headers: { Authorization: `Bearer ${adminToken}` } });
            console.log('   FAIL (Access Allowed)');
        } catch (e) {
            if (e.response?.status === 403) console.log('   PASS (Access Denied)');
            else console.log('   FAIL (Wrong Status:', e.response?.status, ')');
        }

    } catch (error) {
        console.error('FATAL ERROR:', error.message);
        if (error.response) console.error('Data:', JSON.stringify(error.response.data).substring(0, 100));
    }
}

testUserManagement();
