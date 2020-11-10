import { ov_config } from '../lib/ov_config';

/*
 *
 * signupEmail(new_ambassador, address)
 *
 * This function simply takes arguments and fills out an HTML email template with these values.
 * It then returns the filled-out template to be mailed to the administrators for their information.
 *
 */
export const signupEmail = (new_ambassador, address) => `
Organization Name:
<br>
${ov_config.organization_name}
<br>
<br>
Google/FB ID:
<br>
${new_ambassador.get('external_id')}
<br>
<br>
First Name:
<br>
${new_ambassador.get('first_name')}
<br>
<br>
Last Name:
<br>
${new_ambassador.get('last_name')}
<br>
<br>
Date of Birth:
<br>
${new_ambassador.get('date_of_birth')}
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
${new_ambassador.get('email')}
<br>
<br>
Phone Number:
<br>
${new_ambassador.get('phone')}
<br>
<br>
Verification:
<br>
${new_ambassador.get('verification')}
<br>
<br>
Carrier:
<br>
${new_ambassador.get('carrier_info')}
<br>
<br>
`;
