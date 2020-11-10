import { ov_config } from '../lib/ov_config';

/*
 *
 * makeAdminEmail(ambassador, address)
 *
 * This function simply takes in arguments and fills out the email template and returns it
 * This email is meant for administrative information and can be turned on or off via an env var.
 *
 */
export const makeAdminEmail = (ambassador, address) => `
Organization Name:
<br>
${ov_config.organization_name}
<br>
<br>
Google/FB ID:
<br>
${ambassador.get('external_id')}
<br>
<br>
First Name:
<br>
${ambassador.get('first_name')}
<br>
<br>
Last Name:
<br>
${ambassador.get('last_name')}
<br>
<br>
Date of Birth:
<br>
${ambassador.get('date_of_birth')}
<br>
<br>
Street Address:
<br>
${address.address1}
<br>
<br>
Zip:
<br>
${address.zip}
<br>
<br>
Email:
<br>
${ambassador.get('email')}
<br>
<br>
Phone Number:
<br>
${ambassador.get('phone')}
<br>
<br>
`;
