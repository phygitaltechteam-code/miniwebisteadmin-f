import {createFileRoute} from '@tanstack/react-router';
import BeneficiaryStatusRejected from './../../../features/Payments/Components/BeneficiaryStatusRejected';
import React from 'react';
export const Route = createFileRoute('/_app/beneficiary/statusrejected')({
  component: RouteComponent,
});

function RouteComponent() {
  return <BeneficiaryStatusRejected />;
}
